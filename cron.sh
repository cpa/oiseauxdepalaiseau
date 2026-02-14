cd /home/birdlistener/BirdNET-Pi/oiseauxdepalaiseau/
cp /home/birdlistener/BirdNET-Pi/BirdDB.txt /home/birdlistener/BirdNET-Pi/oiseauxdepalaiseau/
/home/birdlistener/BirdNET-Pi/oiseauxdepalaiseau/birddb_to_json.py > /home/birdlistener/BirdNET-Pi/oiseauxdepalaiseau/birddb.json
git add .
git commit -a -m "Updated data"
git pull origin main
git push origin main
