from rest_framework import serializers
from .models import Note, Tag, NoteVersion,RecentlyViewedNote

class NoteSerializer(serializers.ModelSerializer):
    tag = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Tag.objects.all(),
        required=False
    )
    parent =serializers.PrimaryKeyRelatedField(
        queryset=Note.objects.all(),
        required=False,
        allow_null=True
    )
    class Meta:
        model = Note
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at', 'author']

        extra_kwargs = {
            'title': {'required': False, 'allow_blank': True},
            'content': {'required': False, 'allow_blank': True},
            'uuid': {'required': False},
            'is_favorite': {'required': False},
        }

    def to_representation(self, instance):
        rep = super().to_representation(instance)
        rep['tag'] = [tag.id for tag in instance.tag.all()]
        return rep

    def create(self, validated_data):
        tags = validated_data.pop("tag", [])
        user = self.context['request'].user
        note = Note.objects.create(auther=user,**validated_data)
        if tags:
            note.tag.set(tags)
        return note

    def update(self, instance, validated_data):
        tags = validated_data.pop("tag", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if tags is not None:
            instance.tag.set(tags)
        return instance

class NoteVersionSerializer(serializers.ModelSerializer):
    edited_by = serializers.StringRelatedField(read_only=True)
    class Meta:
        model = NoteVersion
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at', 'edited_by']
class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id', 'name']


class RecentlyViewedNoteSerializer(serializers.ModelSerializer):
    note=NoteSerializer()
    
    class Meta:
        model=RecentlyViewedNote
        fields=("note","viewed_at")