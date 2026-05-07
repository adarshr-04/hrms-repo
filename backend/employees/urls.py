from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    LocationViewSet, BranchViewSet, DepartmentViewSet, 
    EmployeeViewSet, EmployeeAddressViewSet
)

router = DefaultRouter()
router.register(r'locations', LocationViewSet)
router.register(r'branches', BranchViewSet)
router.register(r'departments', DepartmentViewSet)
router.register(r'employees', EmployeeViewSet)
router.register(r'addresses', EmployeeAddressViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
