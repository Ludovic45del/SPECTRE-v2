/**
 * Liste de tâches widget — personal todo list stored in dashboard preferences.
 * @module features/dashboard/ui/widgets
 */

import { memo, useCallback, useState } from 'react';
import { Box, Checkbox, IconButton, Stack, TextField, Tooltip, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ChecklistIcon from '@mui/icons-material/Checklist';

import { useDashboardPreferences, useUpdateDashboardPreferences, type TodoItem } from '@entities/dashboard-preferences';
import SectionCard from '@widgets/SectionCard';
import { useDashboardStore } from '../../model/dashboard.store';

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

/** Empty-state placeholder when the todo list is empty. */
const EmptyTodos = memo(function EmptyTodos() {
    return (
        <Box sx={{ textAlign: 'center', py: 3 }}>
            <ChecklistIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
            <Typography variant="body2" color="text.disabled">
                Aucune tâche
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
                gap: 0.5,
                py: 0.5,
                px: 0.5,
                borderRadius: 1,
                '&:hover': { bgcolor: 'action.hover' },
                '&:hover .todo-delete': { opacity: 1 },
            }}
        >
            <Checkbox checked={todo.done} onChange={handleToggle} size="small" sx={{ p: 0.5 }} />
            <Typography
                variant="body2"
                sx={{
                    flex: 1,
                    textDecoration: todo.done ? 'line-through' : 'none',
                    color: todo.done ? 'text.disabled' : 'text.primary',
                    fontSize: '0.85rem',
                }}
            >
                {todo.text}
            </Typography>
            <IconButton
                className="todo-delete"
                size="small"
                onClick={handleDelete}
                sx={{ opacity: 0, transition: 'opacity 0.2s', p: 0.25 }}
            >
                <DeleteIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
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
        <Box sx={{ display: 'flex', gap: 0.5, mb: 1.5 }}>
            <TextField
                size="small"
                placeholder="Nouvelle tâche..."
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={onKeyDown}
                fullWidth
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
            />
            <Tooltip title="Ajouter" arrow>
                <span>
                    <IconButton size="small" onClick={onAdd} disabled={disabled} color="primary">
                        <AddIcon sx={{ fontSize: 20 }} />
                    </IconButton>
                </span>
            </Tooltip>
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
    const todos = prefs?.todos ?? [];
    const remaining = todos.filter((t) => !t.done).length;

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
                <Typography variant="caption" color="text.disabled">
                    {remaining > 0 ? `${remaining} restante${remaining > 1 ? 's' : ''}` : 'Tout fait !'}
                </Typography>
            }
        >
            <AddTaskInput
                value={newTask}
                onChange={setNewTask}
                onKeyDown={handleKeyDown}
                onAdd={handleAdd}
                disabled={!newTask.trim()}
            />

            {/* Liste */}
            {todos.length === 0 ? (
                <EmptyTodos />
            ) : (
                <Stack spacing={0}>
                    {todos.map((todo) => (
                        <TodoItemRow key={todo.id} todo={todo} onToggle={handleToggle} onDelete={handleDelete} />
                    ))}
                </Stack>
            )}
        </SectionCard>
    );
});
