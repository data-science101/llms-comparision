# Contributing to LLMs Comparison Tool

Thank you for your interest in contributing to the LLMs Comparison Tool! This document provides guidelines and instructions for contributing to this project.

## How to Contribute

1. Fork the repository
2. Create a new branch for your feature or bugfix
3. Make your changes
4. Submit a pull request

## Development Setup

1. Clone your fork of the repository
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows, use: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Create a `.env` file with your API keys (see `.env.example`)
5. Start the development server:
   ```bash
   python app.py
   ```

## Project Structure

The project is organized as follows:

```
llms-comparison/
├── app.py               # Main Flask application
├── requirements.txt     # Python dependencies
├── .env.example         # Example environment variables
├── README.md            # Project documentation
├── CONTRIBUTING.md      # Contribution guidelines
├── LICENSE              # License information
├── static/              # Static assets
│   ├── css/
│   │   └── styles.css   # CSS styles
│   └── js/
│       └── main.js      # JavaScript functionality
└── templates/
    └── index.html       # Main HTML template
```

## Code Style Guidelines

- Follow PEP 8 style guide for Python code
- Use docstrings for functions and classes
- Write meaningful commit messages
- Use 4 spaces for indentation in Python code
- Use 2 spaces for indentation in HTML, CSS, and JavaScript

## Adding a New LLM Provider

To add support for a new LLM provider:

1. Add the API key to `.env.example`
2. Add initialization code in `app.py` for the new provider
3. Create functions to fetch models and handle queries
4. Update the frontend in `index.html` to display the new provider
5. Add styling for the new provider in `styles.css`
6. Update the JavaScript in `main.js` to handle the new provider

## Testing

Currently, the project doesn't have automated tests. When contributing:

1. Manually test your changes to ensure they work as expected
2. Verify that all existing features continue to work
3. Test with different LLM providers

If you'd like to contribute automated tests, we welcome contributions that set up a testing framework like pytest.

## Pull Request Process

1. Update the README.md with details of changes if needed
2. Update the documentation if you're changing functionality
3. The PR will be merged once you have the sign-off of at least one maintainer

## Feature Requests

If you have a feature request, please open an issue with:
- A clear description of the feature
- Why this feature would be useful
- Any implementation ideas you have

## Bug Reports

When reporting a bug, please include:
- Steps to reproduce
- Expected behavior
- Actual behavior
- Screenshots if applicable
- Environment details (OS, Python version, etc.)

## Questions?

Feel free to open an issue for any questions you might have about contributing to this project. 