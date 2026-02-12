cp ~/BirdNET-Pi/BirdDB.txt .
./birddb_to_json.py > birddb.json
git add .
git commit -a -m "Updated data"
git pull
git push
