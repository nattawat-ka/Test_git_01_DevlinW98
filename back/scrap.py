import requests
import re
import json
import csv
import os
from bs4 import BeautifulSoup
from urllib.parse import urljoin
from concurrent.futures import ThreadPoolExecutor
from movie import Movie
import firebase_admin
from firebase_admin import credentials,firestore

cred = credentials.Certificate("back/test-web-by-devlin-firebase-adminsdk-pijiq-9afdd5cfd7.json")
firebase_admin.initialize_app(cred)

db = firestore.client()


url = 'https://www.imdb.com/chart/top'
headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
}

response = requests.get(url, headers=headers)
response.raise_for_status()

soup = BeautifulSoup(response.text, 'lxml')

script_tag = soup.find('script', type='application/ld+json')
if script_tag:
    json_ld_content = script_tag.string.strip()
    with open('json_ld_content.json', 'w', encoding='utf-8') as file:
        file.write(json_ld_content)
    
    try:
        data = json.loads(json_ld_content)
        movies_list = []

        def fetch_movie_details(movie):
            title = movie.get('name')
            rating = movie.get('aggregateRating', {}).get('ratingValue')
            description = movie.get('description')
            image_url = movie.get('image')
            duration = 'N/A'
            if movie.get('duration'):
                duration_match = re.search(r'PT(\d+H)?(\d+M)?', movie['duration'])
                if duration_match:
                    hours = duration_match.group(1) or ''
                    minutes = duration_match.group(2) or ''
                    duration = f"{hours.replace('H', ' hours ') if hours else ''}{minutes.replace('M', ' minutes') if minutes else ''}".strip()

            movie_url = urljoin(url, movie['url'])
            movie_response = requests.get(movie_url, headers=headers)
            movie_response.raise_for_status()

            movie_soup = BeautifulSoup(movie_response.text, 'lxml')
            movie_script_tag = movie_soup.find('script', type='application/ld+json')
            if movie_script_tag:
                movie_json_ld = json.loads(movie_script_tag.string.strip())
                director = ', '.join([person['name'] for person in movie_json_ld.get('director', [])])
                genres = ', '.join(movie_json_ld.get('genre', []))
            else:
                director_tag = movie_soup.find('a', href=re.compile(r'/name/nm\d+/'))
                director = director_tag.text.strip() if director_tag else 'N/A'
                genres = ', '.join([genre.text for genre in movie_soup.select('div[data-testid="genres"] a')])

            movie_details = Movie(
                title=title,
                url_picture=image_url,
                score=rating,
                duration=duration,
                description=description,
                director=director,
                genre=genres
            )
            return movie_details

        with ThreadPoolExecutor(max_workers=10) as executor:
            results = executor.map(fetch_movie_details, [item['item'] for item in data['itemListElement']])
            for result in results:
                movies_list.append(result)

        print("Data successfully saved to List_250movies.json and csv_250_movies.csv, and json_ld_content.json file deleted.")
        #testดู#

        # index_movie = movies_list[0]
        # index_movie.get_info()
        # movie_ref = db.collection('movie').document("1")
        

        for i in range(len(movies_list)):
            number = f"{i+1}"
            movie_ref = db.collection('movie').document(number)
            index_movie = movies_list[i]
            movie_ref.set(index_movie.get_info())


    except json.JSONDecodeError as e:
        print(f"JSON decode error: {e}")
else:
    print("JSON-LD script tag not found.")
