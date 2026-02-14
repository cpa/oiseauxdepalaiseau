cp ~/BirdNET-Pi/BirdDB.txt .
./birddb_to_json.py > ~/oiseauxdepalaiseau/birddb.json
git add .
git commit -a -m "Updated data"
git pull origin main
git push origin main
