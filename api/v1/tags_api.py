from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from api.v1.serializers import TagSerializer
from inventory.models import Tag


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def tags(request):
    if request.method == "POST":
        serializer = TagSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(actor=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    qs = Tag.objects.all()
    return Response(TagSerializer(qs, many=True).data)
