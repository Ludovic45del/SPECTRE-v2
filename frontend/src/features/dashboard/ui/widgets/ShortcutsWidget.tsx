/**
 * Shortcuts widget — external links grouped by category.
 * @module features/dashboard/ui/widgets
 */

import { memo, useCallback, useState, useMemo } from 'react';
import { Box, Chip, IconButton, Stack, Tooltip, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import LinkIcon from '@mui/icons-material/Link';

import { useDashboardPreferences, useUpdateDashboardPreferences, type Shortcut } from '@entities/dashboard-preferences';
import SectionCard from '@widgets/SectionCard';
import { ICON_MAP } from '../../lib/iconMap';
import { useDashboardStore } from '../../model/dashboard.store';
import ShortcutFormDialog from '../ShortcutFormDialog';

/* ------------------------------------------------------------------ */
/*  Sub-components (R-STYLE-02 extraction)                            */
/* ------------------------------------------------------------------ */

/** Empty state when no shortcuts exist. */
const EmptyShortcuts = memo(function EmptyShortcuts() {
    return (
        <Box sx={{ textAlign: 'center', py: 3 }}>
            <LinkIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
            <Typography variant="body2" color="text.disabled">
                Aucun raccourci
            </Typography>
            <Typography variant="caption" color="text.disabled">
                Cliquez sur + pour ajouter un lien
            </Typography>
        </Box>
    );
});

/** A single shortcut rendered as a Chip. */
interface ShortcutChipProps {
    readonly shortcut: Shortcut;
    readonly isEditMode: boolean;
    readonly onDelete: (id: string) => void;
}

const ShortcutChip = memo(function ShortcutChip({ shortcut, isEditMode, onDelete }: ShortcutChipProps) {
    const IconComp = ICON_MAP[shortcut.icon] ?? LinkIcon;

    const handleClick = useCallback(() => window.open(shortcut.url, '_blank'), [shortcut.url]);
    const handleDelete = useCallback(() => onDelete(shortcut.id), [onDelete, shortcut.id]);

    return (
        <Tooltip title={shortcut.url} arrow>
            <Chip
                icon={<IconComp sx={{ fontSize: 16 }} />}
                label={shortcut.label}
                size="small"
                onClick={handleClick}
                onDelete={isEditMode ? handleDelete : undefined}
                deleteIcon={isEditMode ? <DeleteIcon sx={{ fontSize: 14 }} /> : undefined}
                sx={{ cursor: 'pointer', borderRadius: 1 }}
            />
        </Tooltip>
    );
});

/** A category group header + its shortcut chips. */
interface ShortcutCategoryGroupProps {
    readonly category: string;
    readonly items: Shortcut[];
    readonly isEditMode: boolean;
    readonly onDelete: (id: string) => void;
}

const ShortcutCategoryGroup = memo(function ShortcutCategoryGroup({
    category,
    items,
    isEditMode,
    onDelete,
}: ShortcutCategoryGroupProps) {
    return (
        <Box>
            <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                    fontWeight: 600,
                    fontSize: '0.7rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    mb: 0.5,
                    display: 'block',
                }}
            >
                {category}
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                {items.map((s) => (
                    <ShortcutChip key={s.id} shortcut={s} isEditMode={isEditMode} onDelete={onDelete} />
                ))}
            </Box>
        </Box>
    );
});

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export default memo(function ShortcutsWidget() {
    const { data: savedPrefs } = useDashboardPreferences();
    const updatePrefs = useUpdateDashboardPreferences();
    const { isEditMode, draftPrefs, updateDraft } = useDashboardStore();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingShortcut, setEditingShortcut] = useState<Shortcut | null>(null);
    const handleOpenDialog = useCallback(() => {
        setEditingShortcut(null);
        setDialogOpen(true);
    }, []);
    const handleCloseDialog = useCallback(() => {
        setDialogOpen(false);
        setEditingShortcut(null);
    }, []);

    const prefs = isEditMode ? draftPrefs : savedPrefs;
    const shortcuts = prefs?.shortcuts ?? [];
    const grouped = useMemo(() => {
        const map = new Map<string, Shortcut[]>();
        for (const s of shortcuts) {
            const cat = s.category || 'Autres';
            if (!map.has(cat)) map.set(cat, []);
            map.get(cat)!.push(s);
        }
        return map;
    }, [shortcuts]);

    const handleDelete = useCallback(
        (id: string) => {
            if (!prefs) return;
            const filtered = prefs.shortcuts.filter((s) => s.id !== id);
            if (isEditMode) {
                updateDraft((draft) => ({ ...draft, shortcuts: filtered }));
            } else {
                updatePrefs.mutate({ ...prefs, shortcuts: filtered });
            }
        },
        [isEditMode, prefs, updateDraft, updatePrefs],
    );

    const handleSave = useCallback(
        (shortcut: Shortcut) => {
            if (!prefs) return;
            const existing = prefs.shortcuts.findIndex((s) => s.id === shortcut.id);
            const updated = [...prefs.shortcuts];
            if (existing >= 0) {
                updated[existing] = shortcut;
            } else {
                updated.push(shortcut);
            }
            if (isEditMode) {
                updateDraft((draft) => ({ ...draft, shortcuts: updated }));
            } else {
                updatePrefs.mutate({ ...prefs, shortcuts: updated });
            }
            setDialogOpen(false);
            setEditingShortcut(null);
        },
        [isEditMode, prefs, updateDraft, updatePrefs],
    );

    return (
        <>
            <SectionCard
                title="Raccourcis"
                action={
                    <IconButton size="small" onClick={handleOpenDialog}>
                        <AddIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                }
            >
                {shortcuts.length === 0 ? (
                    <EmptyShortcuts />
                ) : (
                    <Stack spacing={1.5}>
                        {[...grouped.entries()].map(([category, items]) => (
                            <ShortcutCategoryGroup
                                key={category}
                                category={category}
                                items={items}
                                isEditMode={isEditMode}
                                onDelete={handleDelete}
                            />
                        ))}
                    </Stack>
                )}
            </SectionCard>

            <ShortcutFormDialog
                open={dialogOpen}
                onClose={handleCloseDialog}
                onSave={handleSave}
                shortcut={editingShortcut}
            />
        </>
    );
});
