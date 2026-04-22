/**
 * Create Campaign Modal
 * @module features/create-campaign
 *
 * Modal for creating a new campaign with:
 * - Name, Year, Semester (required)
 * - Type, Installation (required)
 * - Dates, DTRI number, Description (optional)
 * - Team members: MOE, RCE, IEC (optional)
 */

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Stack,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Typography,
    Divider,
    Box,
    IconButton,
    Tabs,
    Tab,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import CloseIcon from '@mui/icons-material/Close';
import { ChipSelect } from '@widgets/chip-select';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CampaignCreateSchema, CampaignCreate, useCreateCampaign } from '@entities/campaign';
import { useAddTeamMember } from '@entities/campaign/team';
import { useCreateCampaignStore } from '../model';
import { CAMPAIGN_TYPES, CAMPAIGN_INSTALLATIONS, CAMPAIGN_ROLE_ID } from '@entities/campaign/core/lib';
import { useNotification } from '@shared/ui';
import { getErrorMessage } from '@shared/lib/error-utils';

const typeOptions = Object.values(CAMPAIGN_TYPES).map((t) => ({
    value: t.id,
    label: t.label,
    color: t.color || '#999',
}));

const installationOptions = Object.values(CAMPAIGN_INSTALLATIONS).map((i) => ({
    value: i.id,
    label: i.label,
    color: i.color || '#999',
}));

export function CreateCampaignModal() {
    const { isOpen, close, reset } = useCreateCampaignStore();
    const createMutation = useCreateCampaign();
    const addTeamMember = useAddTeamMember();
    const { showNotification } = useNotification();
    const [tabValue, setTabValue] = useState(0);

    const {
        control,
        handleSubmit,
        formState: { errors },
        reset: resetForm,
    } = useForm<CampaignCreate>({
        mode: 'onBlur',
        resolver: zodResolver(CampaignCreateSchema),
        defaultValues: {
            name: '',
            year: new Date().getFullYear(),
            semester: 'S1',
            typeId: undefined,
            installationId: undefined,
            dtriNumber: null,
            description: null,
            moe: '',
            rce: '',
            iec: '',
        },
    });

    const onSubmit = async (data: CampaignCreate) => {
        try {
            const campaign = await createMutation.mutateAsync(data);

            // Add team members after campaign creation
            const teamMembers = [
                { name: data.moe, role_id: CAMPAIGN_ROLE_ID.MOE, label: 'MOE' },
                { name: data.rce, role_id: CAMPAIGN_ROLE_ID.RCE, label: 'RCE' },
                { name: data.iec, role_id: CAMPAIGN_ROLE_ID.IEC, label: 'IEC' },
            ];

            const failedMembers: string[] = [];
            for (const member of teamMembers) {
                if (member.name && member.name.trim() !== '') {
                    try {
                        await addTeamMember.mutateAsync({
                            campaign_uuid: campaign.uuid,
                            role_id: member.role_id,
                            name: member.name,
                        });
                    } catch {
                        failedMembers.push(member.label);
                    }
                }
            }

            if (failedMembers.length > 0) {
                showNotification(
                    `Campagne créée mais les membres suivants n'ont pas pu être ajoutés : ${failedMembers.join(', ')}`,
                    'warning',
                );
            } else {
                showNotification('Campagne créée avec succès', 'success');
            }

            resetForm();
            setTabValue(0);
            reset();
        } catch (err: unknown) {
            showNotification(getErrorMessage(err, 'Erreur lors de la création de la campagne'), 'error');
        }
    };

    const handleClose = () => {
        resetForm();
        setTabValue(0);
        close();
    };

    return (
        <Dialog
            open={isOpen}
            onClose={handleClose}
            maxWidth="md"
            fullWidth
            aria-label="Créer une campagne"
            PaperProps={{ sx: { borderRadius: 2 } }}
        >
            {/* Header with Tabs */}
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: 1,
                    borderColor: 'divider',
                    pr: 1,
                }}
            >
                <Tabs
                    value={tabValue}
                    onChange={(_, v) => setTabValue(v)}
                    sx={{ px: 2, minHeight: 64, alignItems: 'center' }}
                >
                    <Tab label="Données générales" sx={{ height: 64, fontWeight: 700, fontSize: '0.95rem' }} />
                </Tabs>
                <IconButton onClick={handleClose} size="small" sx={{ mr: 1 }} aria-label="Fermer">
                    <CloseIcon />
                </IconButton>
            </Box>

            <form id="create-campaign-form" onSubmit={handleSubmit(onSubmit)}>
                <DialogContent sx={{ minHeight: 400, p: 4, pt: 3 }}>
                    {tabValue === 0 && (
                        <Stack spacing={3}>
                            {/* Name (required) */}
                            <Controller
                                name="name"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        label="Nom"
                                        required
                                        error={Boolean(errors.name)}
                                        helperText={errors.name?.message}
                                        fullWidth
                                    />
                                )}
                            />

                            {/* Year + Semester (required) */}
                            <Stack direction="row" spacing={2}>
                                <Controller
                                    name="year"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="Année"
                                            type="number"
                                            required
                                            error={Boolean(errors.year)}
                                            helperText={errors.year?.message}
                                            onChange={(e) => field.onChange(Number(e.target.value))}
                                            fullWidth
                                        />
                                    )}
                                />
                                <Controller
                                    name="semester"
                                    control={control}
                                    render={({ field }) => (
                                        <FormControl fullWidth required>
                                            <InputLabel>Semestre</InputLabel>
                                            <Select {...field} label="Semestre">
                                                <MenuItem value="S1">S1</MenuItem>
                                                <MenuItem value="S2">S2</MenuItem>
                                            </Select>
                                        </FormControl>
                                    )}
                                />
                            </Stack>

                            {/* Type (required) */}
                            <Controller
                                name="typeId"
                                control={control}
                                render={({ field }) => (
                                    <Box>
                                        <ChipSelect
                                            {...field}
                                            label="Type"
                                            options={typeOptions}
                                            required
                                            error={Boolean(errors.typeId)}
                                            value={field.value ?? ''}
                                        />
                                        {errors.typeId && (
                                            <Typography
                                                variant="caption"
                                                color="error"
                                                sx={{ mt: 0.5, ml: 2, display: 'block' }}
                                            >
                                                {errors.typeId.message}
                                            </Typography>
                                        )}
                                    </Box>
                                )}
                            />

                            {/* Installation (required) */}
                            <Controller
                                name="installationId"
                                control={control}
                                render={({ field }) => (
                                    <Box>
                                        <ChipSelect
                                            {...field}
                                            label="Installation"
                                            options={installationOptions}
                                            required
                                            error={Boolean(errors.installationId)}
                                            value={field.value ?? ''}
                                        />
                                        {errors.installationId && (
                                            <Typography
                                                variant="caption"
                                                color="error"
                                                sx={{ mt: 0.5, ml: 2, display: 'block' }}
                                            >
                                                {errors.installationId.message}
                                            </Typography>
                                        )}
                                    </Box>
                                )}
                            />

                            {/* Dates (optional) */}
                            <Stack direction="row" spacing={2}>
                                <Controller
                                    name="startDate"
                                    control={control}
                                    render={({ field: { value, onChange, ...field } }) => (
                                        <DatePicker
                                            {...field}
                                            label="Date de début"
                                            value={value ? dayjs(value) : null}
                                            onChange={(date) => onChange(date?.toDate() || null)}
                                            slotProps={{
                                                textField: {
                                                    fullWidth: true,
                                                    error: Boolean(errors.startDate),
                                                    helperText: errors.startDate?.message,
                                                },
                                            }}
                                        />
                                    )}
                                />
                                <Controller
                                    name="endDate"
                                    control={control}
                                    render={({ field: { value, onChange, ...field } }) => (
                                        <DatePicker
                                            {...field}
                                            label="Date de fin"
                                            value={value ? dayjs(value) : null}
                                            onChange={(date) => onChange(date?.toDate() || null)}
                                            slotProps={{
                                                textField: {
                                                    fullWidth: true,
                                                    error: Boolean(errors.endDate),
                                                    helperText: errors.endDate?.message,
                                                },
                                            }}
                                        />
                                    )}
                                />
                            </Stack>

                            {/* DTRI Number (optional, 0 à 999999) */}
                            <Controller
                                name="dtriNumber"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        value={field.value ?? ''}
                                        label="N° DTRI"
                                        type="number"
                                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                                        error={Boolean(errors.dtriNumber)}
                                        helperText={errors.dtriNumber?.message}
                                        inputProps={{ min: 0, max: 999999, step: 1 }}
                                        fullWidth
                                    />
                                )}
                            />

                            {/* Description (optional) */}
                            <Controller
                                name="description"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        value={field.value ?? ''}
                                        label="Description"
                                        multiline
                                        rows={3}
                                        fullWidth
                                    />
                                )}
                            />

                            {/* Team members section */}
                            <Divider>
                                <Typography variant="overline" color="text.secondary" fontWeight={700}>
                                    Équipe projet
                                </Typography>
                            </Divider>

                            <Stack direction="row" spacing={2}>
                                <Controller
                                    name="moe"
                                    control={control}
                                    render={({ field }) => <TextField {...field} label="MOE" fullWidth />}
                                />
                                <Controller
                                    name="rce"
                                    control={control}
                                    render={({ field }) => <TextField {...field} label="RCE" fullWidth />}
                                />
                                <Controller
                                    name="iec"
                                    control={control}
                                    render={({ field }) => <TextField {...field} label="IEC" fullWidth />}
                                />
                            </Stack>
                        </Stack>
                    )}
                </DialogContent>

                <Divider />

                <DialogActions sx={{ p: 3 }}>
                    <Button type="button" onClick={handleClose} variant="text" color="inherit" sx={{ fontWeight: 600 }}>
                        Annuler
                    </Button>
                    <Button type="submit" variant="contained" size="small" disabled={createMutation.isPending}>
                        {createMutation.isPending ? 'Création...' : 'Créer'}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}
