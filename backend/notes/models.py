from django.db import models
from Users_Api.models import CustomUser
from django.utils.text import slugify
from unidecode import unidecode
import uuid
from django.core.exceptions import ValidationError
# Create your models here.

class Note(models.Model):
    uuid=models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    title = models.CharField(max_length=255,default='New title',blank=True)
    content = models.TextField(default='',blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    author = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='notes')
    is_favorite = models.BooleanField(default=False)
    is_deleted = models.BooleanField(default=False)
    tag=models.ManyToManyField('Tag', blank=True, related_name='notes')
    
    parent = models.ForeignKey('self', null=True, blank=True, on_delete=models.CASCADE, related_name='sub_notes')

    
    def __str__(self):
        return self.title
    
    def clean(self):
        if self.parents_note and self.parents_note.parents_note:
            raise ValidationError("A note cannot have more than one parent note.")
    
    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    class Meta:
        ordering = ['-created_at']
        
class NoteVersion(models.Model):
    note= models.ForeignKey(Note, on_delete=models.CASCADE, related_name='versions')
    title= models.CharField(max_length=255,default='New title',blank=True)
    content = models.TextField(default='',blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    edited_by = models.ForeignKey(CustomUser, null=True, on_delete=models.SET_NULL)
    
    class Meta:
        ordering = ['-created_at']
    
            
    
class Tag(models.Model):
    name = models.CharField(max_length=255, unique=True)
    slug=models.SlugField(max_length=255, unique=True, blank=True)
    author = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='tags')
    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(unidecode(self.name))
        super().save(*args, **kwargs)
    
    def __str__(self):
        return self.name
