import requests
import re
import json
import csv
import os
from bs4 import BeautifulSoup
from urllib.parse import urljoin
from concurrent.futures import ThreadPoolExecutor
from movie import Movie

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

        with open('List_250movies.json', 'w', encoding='utf-8') as jsonfile:
            json.dump([movie.__dict__ for movie in movies_list], jsonfile, ensure_ascii=False, indent=4)

        with open('csv_250_movies.csv', 'w', newline='', encoding='utf-8') as csvfile:
            csv_writer = csv.writer(csvfile)
            csv_writer.writerow(['Title', 'Duration', 'Rating', 'Description', 'Image URL', 'Director', 'Genres'])
            for movie in movies_list:
                csv_writer.writerow([movie.get_title(), movie.get_duration(), movie.get_score(), movie.get_description(), movie.get_url_picture(), movie.get_director(), movie.get_genre()])

        os.remove('json_ld_content.json')

        print("Data successfully saved to List_250movies.json and csv_250_movies.csv, and json_ld_content.json file deleted.")
        #testดู#
        index_movie = movies_list[int(input("insert index 0-249 to print: "))]
        index_movie.display_info()

    except json.JSONDecodeError as e:
        print(f"JSON decode error: {e}")
else:
    print("JSON-LD script tag not found.")
