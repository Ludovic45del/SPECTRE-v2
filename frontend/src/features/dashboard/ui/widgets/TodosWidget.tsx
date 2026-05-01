/**
 * Liste de tâches widget — personal todo list stored in dashboard preferences.
 * @module features/dashboard/ui/widgets
 */

import { memo, useCallback, useMemo, useState } from 'react';
import {
    Box,
    Checkbox,
    IconButton,
    InputAdornment,
    LinearProgress,
    Stack,
    TextField,
    Tooltip,
    Typography,
    alpha,
    useTheme,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ChecklistRtlIcon from '@mui/icons-material/ChecklistRtl';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

import { useDashboardPreferences, useUpdateDashboardPreferences, type TodoItem } from '@entities/dashboard-preferences';
import SectionCard from '@widgets/SectionCard';
import { useDashboardStore } from '../../model/dashboard.store';
import { motion } from '@shared/ui/motion';

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

/** Empty-state placeholder when the todo list is empty. */
const EmptyTodos = memo(function EmptyTodos() {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    return (
        <Box
            sx={{
                textAlign: 'center',
                py: 4,
                px: 2,
                borderRadius: 2,
                border: '1px dashed',
                borderColor: 'divider',
                bgcolor: alpha(theme.palette.primary.main, isDark ? 0.04 : 0.025),
            }}
        >
            <Box
                sx={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    bgcolor: alpha(theme.palette.primary.main, isDark ? 0.15 : 0.08),
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 1.5,
                }}
            >
                <ChecklistRtlIcon sx={{ fontSize: 26, color: 'primary.main' }} />
            </Box>
            <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', mb: 0.25 }}>
                Tout est sous contrôle
            </Typography>
            <Typography variant="caption" color="text.secondary">
                Ajoutez votre première tâche ci-dessus
            </Typography>
        </Box>
    );
});

/** Single todo row with checkbox, label and delete button. */
const TodoItemRow = memo(function TodoItemRow({
    todo,
    onToggle,
    onDelete,
}: {
    todo: TodoItem;
    onToggle: (id: string) => void;
    onDelete: (id: string) => void;
}) {
    const handleToggle = useCallback(() => onToggle(todo.id), [onToggle, todo.id]);
    const handleDelete = useCallback(() => onDelete(todo.id), [onDelete, todo.id]);

    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                py: 0.75,
                px: 1,
                borderRadius: 1.5,
                transition: `background-color ${motion.fast}`,
                '&:hover': { bgcolor: 'action.hover' },
                '&:hover .todo-delete': { opacity: 1, transform: 'translateX(0)' },
            }}
        >
            <Checkbox
                checked={todo.done}
                onChange={handleToggle}
                size="small"
                icon={<RadioButtonUncheckedIcon sx={{ fontSize: 20 }} />}
                checkedIcon={<CheckCircleIcon sx={{ fontSize: 20 }} />}
                sx={{
                    p: 0.5,
                    color: 'text.disabled',
                    '&.Mui-checked': { color: 'success.main' },
                }}
            />
            <Typography
                variant="body2"
                sx={{
                    flex: 1,
                    textDecoration: todo.done ? 'line-through' : 'none',
                    color: todo.done ? 'text.disabled' : 'text.primary',
                    fontSize: '0.875rem',
                    transition: `color ${motion.fast}`,
                    wordBreak: 'break-word',
                }}
            >
                {todo.text}
            </Typography>
            <IconButton
                className="todo-delete"
                size="small"
                onClick={handleDelete}
                aria-label="Supprimer la tâche"
                sx={{
                    opacity: 0,
                    transform: 'translateX(4px)',
                    transition: motion.transition(['opacity', 'transform', 'color'], 'fast'),
                    p: 0.5,
                    color: 'text.disabled',
                    '&:hover': { color: 'error.main', bgcolor: 'transparent' },
                }}
            >
                <DeleteOutlineIcon sx={{ fontSize: 18 }} />
            </IconButton>
        </Box>
    );
});

/** Inline input + add button for creating a new task. */
const AddTaskInput = memo(function AddTaskInput({
    value,
    onChange,
    onKeyDown,
    onAdd,
    disabled,
}: {
    value: string;
    onChange: (v: string) => void;
    onKeyDown: (e: React.KeyboardEvent) => void;
    onAdd: () => void;
    disabled: boolean;
}) {
    return (
        <TextField
            size="small"
            placeholder="Ajouter une tâche..."
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={onKeyDown}
            fullWidth
            sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    bgcolor: 'action.hover',
                    transition: motion.transition(['background-color', 'box-shadow'], 'fast'),
                    '& fieldset': { borderColor: 'transparent' },
                    '&:hover fieldset': { borderColor: 'transparent' },
                    '&.Mui-focused': {
                        bgcolor: 'background.paper',
                        '& fieldset': { borderWidth: 1 },
                    },
                },
                '& .MuiOutlinedInput-input': { py: 1, fontSize: '0.875rem' },
            }}
            InputProps={{
                endAdornment: (
                    <InputAdornment position="end">
                        <Tooltip title="Ajouter (Entrée)" arrow>
                            <span>
                                <IconButton
                                    size="small"
                                    onClick={onAdd}
                                    disabled={disabled}
                                    color="primary"
                                    sx={{
                                        bgcolor: disabled ? 'transparent' : 'primary.main',
                                        color: disabled ? 'text.disabled' : 'primary.contrastText',
                                        transition: `all ${motion.fast}`,
                                        '&:hover': { bgcolor: 'primary.dark' },
                                        '&.Mui-disabled': { bgcolor: 'transparent' },
                                        width: 28,
                                        height: 28,
                                    }}
                                >
                                    <AddIcon sx={{ fontSize: 18 }} />
                                </IconButton>
                            </span>
                        </Tooltip>
                    </InputAdornment>
                ),
            }}
        />
    );
});

/** Subtle progress bar + numeric counter shown above the list. */
const TodosProgress = memo(function TodosProgress({ done, total }: { done: number; total: number }) {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const pct = total === 0 ? 0 : Math.round((done / total) * 100);
    return (
        <Box sx={{ mb: 1.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                    {done} / {total} terminée{total > 1 ? 's' : ''}
                </Typography>
                <Typography
                    variant="caption"
                    sx={{
                        fontWeight: 600,
                        color: pct === 100 ? 'success.main' : 'primary.main',
                        fontVariantNumeric: 'tabular-nums',
                    }}
                >
                    {pct}%
                </Typography>
            </Box>
            <LinearProgress
                variant="determinate"
                value={pct}
                sx={{
                    height: 4,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.primary.main, isDark ? 0.15 : 0.08),
                    '& .MuiLinearProgress-bar': {
                        borderRadius: 2,
                        bgcolor: pct === 100 ? 'success.main' : 'primary.main',
                        transition: `transform ${motion.slow}, background-color ${motion.medium}`,
                    },
                }}
            />
        </Box>
    );
});

/* ------------------------------------------------------------------ */
/*  Main widget                                                        */
/* ------------------------------------------------------------------ */

export default memo(function TodosWidget() {
    const { data: savedPrefs } = useDashboardPreferences();
    const updatePrefs = useUpdateDashboardPreferences();
    const { isEditMode, draftPrefs, updateDraft } = useDashboardStore();
    const [newTask, setNewTask] = useState('');

    const prefs = isEditMode ? draftPrefs : savedPrefs;
    const todos = useMemo(() => prefs?.todos ?? [], [prefs?.todos]);
    const { active, completed } = useMemo(() => {
        const a: TodoItem[] = [];
        const c: TodoItem[] = [];
        for (const t of todos) (t.done ? c : a).push(t);
        return { active: a, completed: c };
    }, [todos]);
    const remaining = active.length;

    const saveTodos = useCallback(
        (updated: TodoItem[]) => {
            if (isEditMode) {
                updateDraft((draft) => ({ ...draft, todos: updated }));
            } else if (savedPrefs) {
                updatePrefs.mutate({ ...savedPrefs, todos: updated });
            }
        },
        [isEditMode, savedPrefs, updateDraft, updatePrefs],
    );

    const handleAdd = useCallback(() => {
        const text = newTask.trim();
        if (!text) return;
        saveTodos([...todos, { id: crypto.randomUUID(), text, done: false }]);
        setNewTask('');
    }, [newTask, todos, saveTodos]);

    const handleToggle = useCallback(
        (id: string) => {
            saveTodos(todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
        },
        [todos, saveTodos],
    );

    const handleDelete = useCallback(
        (id: string) => {
            saveTodos(todos.filter((t) => t.id !== id));
        },
        [todos, saveTodos],
    );

    const handleClearCompleted = useCallback(() => {
        saveTodos(todos.filter((t) => !t.done));
    }, [todos, saveTodos]);

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleAdd();
            }
        },
        [handleAdd],
    );

    return (
        <SectionCard
            title="Liste de tâches"
            action={
                todos.length === 0 ? null : (
                    <Box
                        sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 0.5,
                            px: 1,
                            py: 0.25,
                            borderRadius: 5,
                            bgcolor: remaining === 0 ? 'success.main' : 'action.selected',
                            color: remaining === 0 ? 'success.contrastText' : 'text.secondary',
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            transition: `all ${motion.base}`,
                        }}
                    >
                        {remaining === 0 ? (
                            <>
                                <TaskAltIcon sx={{ fontSize: 12 }} />
                                Tout fait
                            </>
                        ) : (
                            <>{remaining} restante{remaining > 1 ? 's' : ''}</>
                        )}
                    </Box>
                )
            }
        >
            <AddTaskInput
                value={newTask}
                onChange={setNewTask}
                onKeyDown={handleKeyDown}
                onAdd={handleAdd}
                disabled={!newTask.trim()}
            />

            {todos.length === 0 ? (
                <EmptyTodos />
            ) : (
                <>
                    <TodosProgress done={completed.length} total={todos.length} />

                    {active.length > 0 && (
                        <Stack spacing={0}>
                            {active.map((todo) => (
                                <TodoItemRow
                                    key={todo.id}
                                    todo={todo}
                                    onToggle={handleToggle}
                                    onDelete={handleDelete}
                                />
                            ))}
                        </Stack>
                    )}

                    {completed.length > 0 && (
                        <>
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                    mt: active.length > 0 ? 1.5 : 0,
                                    mb: 0.5,
                                    px: 1,
                                }}
                            >
                                <Typography
                                    variant="caption"
                                    sx={{
                                        color: 'text.disabled',
                                        fontWeight: 600,
                                        fontSize: '0.7rem',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em',
                                    }}
                                >
                                    Terminées · {completed.length}
                                </Typography>
                                <Box sx={{ flex: 1, height: 1, bgcolor: 'divider' }} />
                                <Tooltip title="Effacer les tâches terminées" arrow>
                                    <IconButton
                                        size="small"
                                        onClick={handleClearCompleted}
                                        sx={{
                                            p: 0.25,
                                            color: 'text.disabled',
                                            '&:hover': { color: 'error.main' },
                                        }}
                                    >
                                        <DeleteOutlineIcon sx={{ fontSize: 14 }} />
                                    </IconButton>
                                </Tooltip>
                            </Box>
                            <Stack spacing={0}>
                                {completed.map((todo) => (
                                    <TodoItemRow
                                        key={todo.id}
                                        todo={todo}
                                        onToggle={handleToggle}
                                        onDelete={handleDelete}
                                    />
                                ))}
                            </Stack>
                        </>
                    )}
                </>
            )}
        </SectionCard>
    );
});
