# Generated by Django 2.1.4 on 2020-06-15 09:06

from django.db import migrations


def forward(apps, se):
    # link existing Documents with default typology
    Typology = apps.get_model('core', 'Typology')

    to_create = []
    regions_types = ['Title', 'Main', 'Commentary', 'Illustration']
    for type_ in regions_types:
        to_create.append(Typology(target=3,   # Typology.TARGET_BLOCK doesnt work in migration :(
                                  name=type_,
                                  default=True, public=True))
    Typology.objects.bulk_create(to_create)

    to_create = []
    lines_types = ['Main', 'Numbering', 'Correction', 'Signature']
    for type_ in lines_types:
        to_create.append(Typology(target=4,   # Typology.TARGET_LINE
                                  name=type_,
                                  default=False, public=True))
    Typology.objects.bulk_create(to_create)


def backward(apps, se):
    Typology = apps.get_model('core', 'Typology')
    Typology.objects.filter(public=True).delete()


class Migration(migrations.Migration):
    dependencies = [
        ('core', '0037_auto_20200610_1405'),
    ]

    operations = [
        migrations.RunPython(forward, backward),
    ]
