from django.urls import path, include

from users.views import (SendInvitation, AcceptInvitation, AcceptGroupInvitation, ContactUsView,
                         ProfileInfos, ProfileGroupListCreate, ProfileApiKey, ProfileFiles,
                         GroupDetail, RemoveFromGroup, LeaveGroup, TransferGroupOwnership)
from django.contrib.auth.decorators import permission_required

urlpatterns = [
    path('', include('django.contrib.auth.urls')),
    path('profile/', ProfileInfos.as_view(), name='profile'),
    path('profile/apikey/', ProfileApiKey.as_view(), name='profile-api-key'),
    path('profile/files/', ProfileFiles.as_view(), name='profile-files'),
    path('profile/teams/', ProfileGroupListCreate.as_view(), name='profile-team-list'),
    path('teams/<int:pk>/', GroupDetail.as_view(), name='team-detail'),
    path('teams/<int:pk>/remove/', RemoveFromGroup.as_view(), name='team-remove-user'),
    path('teams/<int:pk>/leave/', LeaveGroup.as_view(), name='team-leave'),
    path('teams/<int:pk>/transfer-ownership/',
         TransferGroupOwnership.as_view(),
         name='team-transfer-ownership'),
    path('invite/',
         permission_required('users.can_invite', raise_exception=True)(SendInvitation.as_view()),
         name='send-invitation'),
    path('accept/<token>/', AcceptInvitation.as_view(), name='accept-invitation'),
    path('accept/group/<slug>/', AcceptGroupInvitation.as_view(), name='accept-group-invitation'),
    path('contact/', ContactUsView.as_view(), name='contactus'),
]
