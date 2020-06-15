# Generated by Django 2.1.4 on 2020-06-15 09:06

from django.db import migrations


def forward(apps, se):
    """
    Link default typologies with all existing documents
    """
    Document = apps.get_model('core', 'Document')
    Typology = apps.get_model('core', 'Typology')

    data = []
    for typology in Typology.objects.filter(default=True):
        for doc in Document.objects.all():
            data.append(Document.valid_types.through(document=doc, typology=typology))

    Document.valid_types.through.objects.bulk_create(data)


def backward(apps, se):
    Document = apps.get_model('core', 'Document')

    Document.valid_types.through.objects.all().delete()


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0038_create_default_typologies'),
    ]

    operations = [
        migrations.RunPython(forward, backward),
    ]
