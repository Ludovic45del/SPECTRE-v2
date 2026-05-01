"""Planning API URLs."""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from app.api.planning.planning_controller import (
    LabEventController,
    LabMachineController,
    LabSalleController,
    PlanningCampaignStepController,
    PlanningCellAnnotationController,
    PlanningFsecCellLinkController,
    PlanningMemberPeriodController,
    PlanningWeekStateController,
)

router = DefaultRouter()
router.register(r"week-states", PlanningWeekStateController, basename="planning-week-states")
router.register(
    r"member-periods",
    PlanningMemberPeriodController,
    basename="planning-member-periods",
)
router.register(
    r"cell-annotations",
    PlanningCellAnnotationController,
    basename="planning-cell-annotations",
)
router.register(
    r"fsec-cell-links",
    PlanningFsecCellLinkController,
    basename="planning-fsec-cell-links",
)
router.register(
    r"campaign-steps",
    PlanningCampaignStepController,
    basename="planning-campaign-steps",
)
router.register(r"lab-salles", LabSalleController, basename="planning-lab-salles")
router.register(r"lab-machines", LabMachineController, basename="planning-lab-machines")
router.register(r"lab-events", LabEventController, basename="planning-lab-events")

urlpatterns = [
    path("", include(router.urls)),
]
