# Generated by Django 2.1.4 on 2018-12-20 10:54

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0016_auto_20181220_0952'),
    ]

    operations = [
        migrations.CreateModel(
            name='DocumentProcessSettings',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('automatically_process', models.BooleanField(default=True)),
                ('text_direction', models.CharField(choices=[('horizontal-lr', 'Horizontal'), ('vertical-lr', 'Vertical')], default='horizontal-lr', max_length=64)),
                ('binarizer', models.CharField(choices=[('kraken', 'Kraken')], max_length=64)),
                ('document', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='process_settings', to='core.Document')),
                ('ocrmodel', models.ForeignKey(limit_choices_to={'trained': True}, null=True, on_delete=django.db.models.deletion.SET_NULL, to='core.OcrModel', verbose_name='Model')),
                ('typology', models.ForeignKey(limit_choices_to={'target': 2}, null=True, on_delete=django.db.models.deletion.SET_NULL, to='core.Typology')),
            ],
        ),
    ]
