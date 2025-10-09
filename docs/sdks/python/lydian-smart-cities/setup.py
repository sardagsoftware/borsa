"""
Setup script for lydian-smart-cities SDK
"""

from setuptools import setup, find_packages

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

setup(
    name="lydian-smart-cities",
    version="1.0.0",
    author="LyDian Platform",
    author_email="support@lydian.com",
    description="Python SDK for LyDian Smart Cities API",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/lydian/sdks",
    project_urls={
        "Documentation": "https://docs.lydian.com/api/smart-cities",
        "Source": "https://github.com/lydian/sdks/tree/main/python/lydian-smart-cities",
        "Issues": "https://github.com/lydian/sdks/issues",
    },
    packages=find_packages(),
    classifiers=[
        "Development Status :: 5 - Production/Stable",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Programming Language :: Python :: 3.12",
        "Topic :: Software Development :: Libraries :: Python Modules",
    ],
    python_requires=">=3.8",
    install_requires=[
        "requests>=2.28.0",
        "urllib3>=1.26.0",
    ],
    keywords="lydian smart-cities iot api sdk",
)
