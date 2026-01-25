# Use an official Python runtime as a parent image
FROM python:3.9-slim

# Set the working directory to /code
WORKDIR /code

# Install system dependencies
RUN apt-get update && apt-get install -y \
    ghostscript \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Copy the file with the requirements to the /code directory.
COPY requirements.txt /code/requirements.txt

# Install the package dependencies in the requirements file.
RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt

# Copy the Backend directory to the /code directory.
COPY Backend /code/Backend

# Set the working directory to /code/Backend so that 'app' and 'WeaviateGeminiInterface' are in the python path.
WORKDIR /code/Backend

# Command to run the uvicorn server.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "80"]
