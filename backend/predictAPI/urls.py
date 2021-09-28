from django.urls import path
from .views import DiscardSession, saveToSession, path_CSV_to_react, register_new_user, userInfo, user_authentication, passData_to_react, map_view_info, settings_to_react, logOut

urlpatterns = [
    path('passData/', passData_to_react.as_view(), name='get pass data'),
    path('mapviewInfo/', map_view_info.as_view(), name='get map data'),
    path('get_path_csv/', path_CSV_to_react.as_view(), name='Pass path csv'),
    path('settings/', settings_to_react.as_view(),
         name='get and post settings data'),
    path('logIn/', user_authentication.as_view(), name='Log in'),
    path('userInfo/', userInfo.as_view(), name='User info'),
    path('new_user/', register_new_user.as_view(), name='register new user'),
    path('logout/', logOut.as_view(), name='Log out'),
    path('save_to_session/', saveToSession.as_view(), name='Save to session'),
    path('discard_session/', DiscardSession.as_view(), name='discard session')
]
