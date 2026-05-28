from django.urls import path

from .views import (
    AccidentReportView,
    AdminBroadcastView,
    AnalyticsChartsView,
    AnalyticsSummaryView,
    AttendanceCreateView,
    AttendanceReviewActionView,
    AttendanceReviewListView,
    CommitteeMembershipManageView,
    CommitteeMembershipRemoveView,
    CommitteeReportCreateView,
    CommitteeReportListView,
    CommitteeReportRespondView,
    CreateAdminUserView,
    EventAttendanceToggleView,
    EventCSVReportView,
    EventEndView,
    EventJoinCommitteeView,
    EventListCreateView,
    EventPickView,
    EventPrepareView,
    EventStartView,
    ExperienceRatingView,
    ExpenditureView,
    JSONAnalyzeUploadView,
    LiveMetricsView,
    LoginView,
    MeView,
    MyAttendanceView,
    MyCommitteesView,
    MySelectionsView,
    RegisterView,
)


urlpatterns = [
    # Auth
    path("auth/register/",      RegisterView.as_view()),
    path("auth/login/",         LoginView.as_view()),
    path("auth/me/",            MeView.as_view()),
    path("auth/create-admin/",  CreateAdminUserView.as_view()),

    # Events — specific paths BEFORE the parameterised ones
    path("events/",                    EventListCreateView.as_view()),
    path("events/my-selections/",      MySelectionsView.as_view()),   # NEW
    path("events/my-committees/",      MyCommitteesView.as_view()),   # NEW
    path("events/<int:event_id>/prepare/",            EventPrepareView.as_view()),
    path("events/<int:event_id>/join-committee/",     EventJoinCommitteeView.as_view()),
    path("events/<int:event_id>/committee-members/",  CommitteeMembershipManageView.as_view()),
    path(
        "events/<int:event_id>/committee-members/<int:membership_id>/",
        CommitteeMembershipRemoveView.as_view(),
    ),
    path("events/<int:event_id>/start/",              EventStartView.as_view()),
    path("events/<int:event_id>/end/",                EventEndView.as_view()),
    path("events/<int:event_id>/attendance-toggle/",  EventAttendanceToggleView.as_view()),
    path("events/<int:event_id>/pick/",               EventPickView.as_view()),
    path("events/<int:event_id>/report.csv",          EventCSVReportView.as_view()),

    # Attendance
    path("attendance/",                          AttendanceCreateView.as_view()),
    path("attendance/my/",                       MyAttendanceView.as_view()),       # NEW
    path("attendance/review/<int:event_id>/",    AttendanceReviewListView.as_view()),
    path("attendance/<int:attendance_id>/review/", AttendanceReviewActionView.as_view()),

    # Committee reports
    path("committee-reports/",                        CommitteeReportListView.as_view()),
    path("committee-reports/create/",                 CommitteeReportCreateView.as_view()),
    path("committee-reports/<int:report_id>/respond/", CommitteeReportRespondView.as_view()),

    # Misc
    path("broadcasts/",    AdminBroadcastView.as_view()),
    path("accidents/",     AccidentReportView.as_view()),
    path("ratings/",       ExperienceRatingView.as_view()),
    path("expenditures/",  ExpenditureView.as_view()),

    # Analytics
    path("analytics/event/<int:event_id>/summary/", AnalyticsSummaryView.as_view()),
    path("analytics/event/<int:event_id>/charts/",  AnalyticsChartsView.as_view()),
    path("analytics/live/",                         LiveMetricsView.as_view()),
    path("analytics/upload-json/",                  JSONAnalyzeUploadView.as_view()),
]