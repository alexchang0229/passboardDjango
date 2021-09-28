# Generated by Django 3.2.7 on 2021-09-12 14:45

from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='user_settings',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('custom_settings', models.JSONField(default={'customStartTime': '2021-09-12T10:45:31.661324Z', 'minElevation': 5.0, 'predHours': 24.0, 'predictionType': 'realtime', 'satList': {0: {'NORADid': 25338, 'name': 'NOAA 15', 'priority': 0}, 1: {'NORADid': 28654, 'name': 'NOAA 18', 'priority': 1}, 2: {'NORADid': 33591, 'name': 'NOAA 19', 'priority': 2}, 3: {'NORADid': 38771, 'name': 'METOP-B', 'priority': 3}, 4: {'NORADid': 43689, 'name': 'METOP-C', 'priority': 4}, 5: {'NORADid': 37214, 'name': 'FENGYUN 3B', 'priority': 5}}, 'stationLat': 45.51, 'stationLong': -73.43})),
                ('username', models.CharField(default='username', max_length=30)),
            ],
        ),
    ]
