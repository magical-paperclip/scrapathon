import requests
from bs4 import BeautifulSoup
import pandas as pd
import json
import re
from concurrent.futures import ThreadPoolExecutor, as_completed

"""
Web Scraper for Hackathon Sponsors and Contacts

This script scrapes hackathon information from multiple sources, including:
- Devpost (https://devpost.com/hackathons)
- Hack Club Hackathons (https://hackathons.hackclub.com/)

Features:
- Extracts hackathon names, links, sponsors, and contacts.
- Uses concurrent execution for faster scraping.
- Saves results to CSV and JSON formats.

Note: Sponsors and contacts are not always publicly available. The scraper attempts to extract them from individual hackathon pages.
Direct contacts (e.g., emails) are extracted if visible on the page.

Usage:
Run the script: python scraper.py
Results will be saved as hackathons.csv and hackathons.json.
"""

def extract_emails(text):
    """Extract email addresses from text using regex."""
    email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
    return re.findall(email_pattern, text)

def scrape_devpost_hackathons():
    """
    Scrape hackathons from Devpost.
    Extracts basic info and attempts to get sponsors/contacts from individual pages.
    """
    url = "https://devpost.com/hackathons"
    response = requests.get(url)
    soup = BeautifulSoup(response.text, 'html.parser')
    hackathons = []
    for hack in soup.select('.hackathon-tile'):  # Devpost uses this class for hackathon cards
        name = hack.select_one('.title').get_text(strip=True) if hack.select_one('.title') else None
        link = hack.select_one('a')['href'] if hack.select_one('a') else None
        full_link = f"https://devpost.com{link}" if link and link.startswith('/') else link
        sponsors = []
        contacts = []
        if full_link:
            # Scrape individual page for more details
            try:
                page_response = requests.get(full_link)
                page_soup = BeautifulSoup(page_response.text, 'html.parser')
                # Extract sponsors (look for sponsor sections)
                sponsor_elements = page_soup.select('.sponsor, .partner')  # Adjust selectors as needed
                sponsors = [s.get_text(strip=True) for s in sponsor_elements]
                # Extract contacts (emails from page text)
                page_text = page_soup.get_text()
                contacts = extract_emails(page_text)
            except Exception as e:
                print(f"Error scraping {full_link}: {e}")
        hackathons.append({
            'name': name,
            'link': full_link,
            'sponsors': sponsors,
            'contacts': contacts
        })
    return hackathons

def scrape_hackclub_hackathons():
    """
    Scrape hackathons from Hack Club.
    Extracts basic info and attempts to get sponsors/contacts from individual pages.
    """
    url = "https://hackathons.hackclub.com/"
    response = requests.get(url)
    soup = BeautifulSoup(response.text, 'html.parser')
    hackathons = []
    # Hack Club lists hackathons in a grid or list; adjust selector based on actual HTML
    for hack in soup.select('a[href*="/hackathons/"]'):  # Links to individual hackathons
        name = hack.get_text(strip=True)
        link = hack['href']
        full_link = f"https://hackathons.hackclub.com{link}" if link.startswith('/') else link
        sponsors = []
        contacts = []
        if full_link:
            # Scrape individual page for more details
            try:
                page_response = requests.get(full_link)
                page_soup = BeautifulSoup(page_response.text, 'html.parser')
                # Extract sponsors (look for sponsor sections)
                sponsor_elements = page_soup.select('.sponsor, .partner')  # Adjust selectors
                sponsors = [s.get_text(strip=True) for s in sponsor_elements]
                # Extract contacts (emails from page text)
                page_text = page_soup.get_text()
                contacts = extract_emails(page_text)
            except Exception as e:
                print(f"Error scraping {full_link}: {e}")
        hackathons.append({
            'name': name,
            'link': full_link,
            'sponsors': sponsors,
            'contacts': contacts
        })
    return hackathons

def scrape_all_sources():
    """
    Scrape from all sources concurrently for speed.
    """
    sources = [
        scrape_devpost_hackathons,
        scrape_hackclub_hackathons
    ]
    all_hackathons = []
    with ThreadPoolExecutor(max_workers=2) as executor:
        futures = [executor.submit(func) for func in sources]
        for future in as_completed(futures):
            all_hackathons.extend(future.result())
    return all_hackathons

def save_results(hackathons, filename_prefix="hackathons"):
    """
    Save hackathons data to CSV and JSON files.
    """
    df = pd.DataFrame(hackathons)
    df.to_csv(f"{filename_prefix}.csv", index=False)
    with open(f"{filename_prefix}.json", "w", encoding="utf-8") as f:
        json.dump(hackathons, f, indent=2)

if __name__ == "__main__":
    print("Scraping hackathons from all sources...")
    hackathons = scrape_all_sources()
    print(f"Found {len(hackathons)} hackathons.")
    save_results(hackathons)
    print("Results saved to hackathons.csv and hackathons.json.")
