/**
 * PlanningEditPopover — Popover pour éditer annotations campagne et liens FSEC.
 * Les périodes membres et événements labo ont leurs propres popovers inline.
 */
import { useEffect, useState } from 'react';
import {
    Box,
    Button,
    IconButton,
    Popover,
    Table,
    TableBody,
    TableCell,
    TableRow,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import { ArrowForward } from '@mui/icons-material';
import {
    useUpsertCellAnnotation,
    useDeleteCellAnnotation,
    useCreateFsecCellLink,
    useDeleteFsecCellLink,
} from '@entities/planning/core/api/planning.queries';
import { useFsecs } from '@entities/fsec/core/api/fsec.queries';
import { usePlanningColors, usePlanningData } from '../lib/planning.hooks';
import { usePlanningStore, type PopoverTarget } from '../lib/planning.store';

export function PlanningEditPopover() {
    const target = usePlanningStore((s) => s.popoverTarget);
    const closePopover = usePlanningStore((s) => s.closePopover);
    const selectedYear = usePlanningStore((s) => s.selectedYear);

    if (!target || target.section !== 'campaign') return null;

    return (
        <Popover
            open
            anchorReference="anchorPosition"
            anchorPosition={target.anchorPosition ?? undefined}
            onClose={closePopover}
            transformOrigin={{ vertical: 'top', horizontal: 'center' }}
            slotProps={{ paper: { sx: { borderRadius: 2, boxShadow: 6 } } }}
        >
            <CampaignPopoverContent target={target} year={selectedYear} onClose={closePopover} />
        </Popover>
    );
}

// ====================== Campaign Popover ======================

function CampaignPopoverContent({
    target,
    year,
    onClose,
}: {
    target: PopoverTarget;
    year: number;
    onClose: () => void;
}) {
    const colors = usePlanningColors();
    const { annotationsMap, fsecLinksMap } = usePlanningData(year);
    const upsertAnnotation = useUpsertCellAnnotation();
    const deleteAnnotation = useDeleteCellAnnotation();
    const createFsecLink = useCreateFsecCellLink();
    const deleteFsecLink = useDeleteFsecCellLink();
    const { data: allFsecs = [] } = useFsecs();

    const campaignUuid = target.campaignUuid ?? '';
    const stepLabel = target.stepLabel ?? '';
    const slot = target.timeSlots[0];

    const cellKey = `${campaignUuid}#${stepLabel}#${slot?.weekNum}`;
    const annotation = annotationsMap.get(cellKey);
    const links = fsecLinksMap.get(cellKey) ?? [];
    const campaignFsecs = allFsecs.filter((f) => f.campaignId === campaignUuid);

    const [annotationText, setAnnotationText] = useState(annotation?.text ?? '');

    useEffect(() => {
        setAnnotationText(annotation?.text ?? '');
    }, [annotation]);

    function handleSaveAnnotation() {
        if (!slot) return;
        if (annotationText.trim()) {
            upsertAnnotation.mutate({
                campaignUuid,
                stepLabel,
                year: slot.year,
                weekNum: slot.weekNum,
                text: annotationText.trim(),
            });
        } else if (annotation) {
            deleteAnnotation.mutate({ uuid: annotation.uuid, year: slot.year });
        }
    }

    function handleToggleFsec(fsecUuid: string) {
        if (!slot) return;
        const existing = links.find((l) => l.fsecUuid === fsecUuid);
        if (existing) {
            deleteFsecLink.mutate({ uuid: existing.uuid, year: slot.year });
        } else {
            createFsecLink.mutate({
                campaignUuid,
                stepLabel,
                year: slot.year,
                weekNum: slot.weekNum,
                fsecUuid,
            });
        }
    }

    return (
        <Box sx={{ p: 2.5, minWidth: 300, maxWidth: 380 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <Typography fontWeight={600} fontSize={14}>
                    {stepLabel}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    S{slot?.weekNum}
                </Typography>
            </Box>

            <TextField
                label="Annotation"
                value={annotationText}
                onChange={(e) => setAnnotationText(e.target.value)}
                onBlur={handleSaveAnnotation}
                size="small"
                fullWidth
                placeholder="Texte affiché en cellule"
                sx={{ mb: 2 }}
            />

            <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>
                FSEC de la campagne
            </Typography>
            <Box sx={{ border: `1px solid ${colors.border}`, borderRadius: 1, overflow: 'hidden', bgcolor: colors.bg }}>
                <Table size="small">
                    <TableBody>
                        {campaignFsecs.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={2} align="center">
                                    <Typography variant="body2" color="text.secondary">
                                        Aucun FSEC
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        )}
                        {campaignFsecs.map((fsec) => {
                            const isLinked = links.some((l) => l.fsecUuid === fsec.fsecUuid);
                            return (
                                <TableRow key={fsec.fsecUuid}>
                                    <TableCell sx={{ fontSize: 13, fontWeight: isLinked ? 600 : 400 }}>
                                        {fsec.name}
                                    </TableCell>
                                    <TableCell align="right" sx={{ width: 36, pr: 0 }}>
                                        <Tooltip title={isLinked ? 'Dissocier' : 'Associer'}>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleToggleFsec(fsec.fsecUuid)}
                                                disabled={createFsecLink.isPending || deleteFsecLink.isPending}
                                            >
                                                <ArrowForward
                                                    fontSize="small"
                                                    sx={{ color: isLinked ? '#388e3c' : '#7e8ba3' }}
                                                />
                                            </IconButton>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1.5 }}>
                <Button variant="outlined" size="small" onClick={onClose} sx={{ textTransform: 'none', fontSize: 13 }}>
                    Fermer
                </Button>
            </Box>
        </Box>
    );
}
