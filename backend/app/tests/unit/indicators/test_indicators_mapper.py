"""Tests unitaires pour le mapper Indicators (Bean → API)."""

import pytest

from app.domain.indicators.models.indicators_bean import (
    FaIndicatorsBean,
    FsecIndicatorsBean,
    IndicatorsBean,
    OperatorWorkloadBean,
    StepDurationBean,
)
from app.mapper.indicators.indicators_mapper import (
    fa_indicators_bean_to_api,
    fsec_indicators_bean_to_api,
    indicators_bean_to_api,
    operator_workload_bean_to_api,
    step_duration_bean_to_api,
)

pytestmark = pytest.mark.unit


def test_step_duration_bean_to_api_keys():
    bean = StepDurationBean(
        key="a_to_b",
        label="A → B",
        count=3,
        avg_days=2.5,
        median_days=2.0,
        min_days=1.0,
        max_days=4.0,
        is_gas=True,
    )
    api = step_duration_bean_to_api(bean)
    assert api == {
        "key": "a_to_b",
        "label": "A → B",
        "count": 3,
        "avg_days": 2.5,
        "median_days": 2.0,
        "min_days": 1.0,
        "max_days": 4.0,
        "is_gas": True,
    }


def test_step_duration_bean_to_api_preserves_nulls():
    bean = StepDurationBean(key="k", label="l", count=0, is_gas=False)
    api = step_duration_bean_to_api(bean)
    assert api["avg_days"] is None
    assert api["median_days"] is None
    assert api["min_days"] is None
    assert api["max_days"] is None
    assert api["is_gas"] is False


def test_fa_indicators_bean_to_api_includes_all_fields():
    bean = FaIndicatorsBean(
        total_created_in_year=10,
        by_status={"0": 5, "1": 5},
        by_criticality={"1": 7},
        by_discovery_step={"3": 4},
        open_stock_all_years=42,
        avg_event_to_open_days=1.5,
        avg_open_to_progress_days=3.0,
        avg_progress_to_closure_days=10.2,
        avg_total_lifecycle_days=14.7,
        created_per_month={"2026-01": 3, "2026-02": 7},
    )
    api = fa_indicators_bean_to_api(bean)
    assert api["total_created_in_year"] == 10
    assert api["by_status"] == {"0": 5, "1": 5}
    assert api["by_criticality"] == {"1": 7}
    assert api["by_discovery_step"] == {"3": 4}
    assert api["open_stock_all_years"] == 42
    assert api["avg_event_to_open_days"] == 1.5
    assert api["avg_open_to_progress_days"] == 3.0
    assert api["avg_progress_to_closure_days"] == 10.2
    assert api["avg_total_lifecycle_days"] == 14.7
    assert api["created_per_month"] == {"2026-01": 3, "2026-02": 7}


def test_fsec_indicators_bean_to_api_includes_all_fields():
    bean = FsecIndicatorsBean(
        total_created_in_year=20,
        total_shot_in_year=8,
        by_status={"7": 8},
        by_category={"0": 12, "1": 8},
        avg_cycle_time_days=42.0,
        median_cycle_time_days=40.0,
        shot_per_month={"2026-01": 3, "2026-02": 5},
    )
    api = fsec_indicators_bean_to_api(bean)
    assert api["total_created_in_year"] == 20
    assert api["total_shot_in_year"] == 8
    assert api["by_status"] == {"7": 8}
    assert api["by_category"] == {"0": 12, "1": 8}
    assert api["avg_cycle_time_days"] == 42.0
    assert api["median_cycle_time_days"] == 40.0
    assert api["shot_per_month"] == {"2026-01": 3, "2026-02": 5}


def test_operator_workload_bean_to_api():
    bean = OperatorWorkloadBean(user_uuid="u1", name="Alice", steps_count=12)
    assert operator_workload_bean_to_api(bean) == {
        "user_uuid": "u1",
        "name": "Alice",
        "steps_count": 12,
    }


def test_indicators_bean_to_api_aggregates_everything():
    bean = IndicatorsBean(
        year=2026,
        fa=FaIndicatorsBean(total_created_in_year=1),
        fsec=FsecIndicatorsBean(total_created_in_year=2),
        step_durations=[
            StepDurationBean(key="k", label="l", count=0),
        ],
        top_operators=[
            OperatorWorkloadBean(user_uuid="u1", name="Alice", steps_count=1)
        ],
        bottleneck_step_key="k",
    )
    api = indicators_bean_to_api(bean)
    assert api["year"] == 2026
    assert api["fa"]["total_created_in_year"] == 1
    assert api["fsec"]["total_created_in_year"] == 2
    assert len(api["step_durations"]) == 1
    assert len(api["top_operators"]) == 1
    assert api["bottleneck_step_key"] == "k"
