from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, List
import json
import os

app = FastAPI(title="Job Board API", description="API for fetching and filtering job listings")

# Configure CORS so the frontend can retrieve data without getting origins errors
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development purposes, allow all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
)

def load_jobs() -> List[dict]:
    """Helper function to load jobs from the local jobs.json file."""
    # Build a stable path to avoid issues if the script is run from a different directory
    file_path = os.path.join(os.path.dirname(__file__), 'jobs.json')
    try:
        with open(file_path, "r", encoding="utf-8") as file:
            return json.load(file)
    except FileNotFoundError:
        return []

@app.get("/api/locations")
def get_locations():
    """
    GET endpoint to retrieve all unique locations from the job listings.
    """
    jobs = load_jobs()
    locations = sorted(list(set(job.get("location", "") for job in jobs if job.get("location"))))
    return locations

@app.get("/api/jobs")
def get_jobs(
    title: Optional[str] = Query(None, description="Search by specific keywords across multiple fields"),
    location: Optional[str] = Query(None, description="Filter by city or country"),
    category: Optional[str] = Query(None, description="Filter by job category (e.g., IT, Marketing)"),
    experience: Optional[str] = Query(None, description="Filter by experience level (e.g., Fresher, Mid-level)")
):
    """
    GET endpoint to retrieve job listings.
    Supports query parameters for filtering by title, location, category, and experience.
    """
    jobs = load_jobs()
    
    # Filter by Title/Keywords (case-insensitive substring match across multiple fields) mapping relevance
    if title:
        keyword = title.lower()
        scored_jobs = []
        for job in jobs:
            score = 0
            j_title = job.get("title", "").lower()
            j_desc = job.get("description", "").lower()
            j_comp = job.get("company", "").lower()
            j_cat = job.get("category", "").lower()

            # Exact category match is highly relevant (e.g. searching "IT" for IT jobs)
            if keyword == j_cat:
                score += 100
            elif keyword in j_cat:
                score += 50

            # Title matches are also highly relevant
            if keyword == j_title:
                score += 100
            elif keyword in j_title:
                score += 75

            # Company matches
            if keyword == j_comp:
                score += 50
            elif keyword in j_comp:
                score += 25

            # Description matches (lowest relevance)
            if keyword in j_desc:
                score += 10

            if score > 0:
                # Add a temporary sorting key
                job['_relevance'] = score
                scored_jobs.append(job)

        # Sort jobs by relevance in descending order
        scored_jobs.sort(key=lambda x: x['_relevance'], reverse=True)

        # Remove the temporary key
        for job in scored_jobs:
            del job['_relevance']

        jobs = scored_jobs
        
    # Filter by Location (case-insensitive substring match)
    if location:
        jobs = [job for job in jobs if location.lower() in job.get("location", "").lower()]
        
    # Filter by Category (exact match, case-insensitive)
    if category:
        jobs = [job for job in jobs if category.lower() == job.get("category", "").lower()]
        
    # Filter by Experience (exact match, case-insensitive)
    if experience:
        jobs = [job for job in jobs if experience.lower() == job.get("experience", "").lower()]
        
    return jobs

if __name__ == "__main__":
    import uvicorn
    # Run the server on localhost port 8000
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
