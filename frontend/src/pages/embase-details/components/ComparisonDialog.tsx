import { memo } from 'react';
import { Dialog, DialogTitle, DialogContent, Stack, Typography, IconButton } from '@mui/material';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import CloseIcon from '@mui/icons-material/Close';
import { type Embase } from '@entities/embase';
import { ComparaisonTab } from '@features/embase/comparaison-tab';

interface ComparisonDialogProps {
    open: boolean;
    onClose: () => void;
    embase: Embase;
}

export const ComparisonDialog = memo(function ComparisonDialog({ open, onClose, embase }: ComparisonDialogProps) {
    return (
        <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Stack direction="row" spacing={1} alignItems="center">
                    <CompareArrowsIcon sx={{ color: '#9c27b0' }} />
                    <Typography variant="h6" fontWeight={600}>
                        Comparaison V1 / V2 — {embase.identifier}
                    </Typography>
                </Stack>
                <IconButton onClick={onClose} size="small">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent dividers sx={{ p: 3 }}>
                {open && <ComparaisonTab embase={embase} />}
            </DialogContent>
        </Dialog>
    );
});
