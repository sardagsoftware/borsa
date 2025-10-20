from setuptools import setup, find_packages

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

setup(
    name="lydian-sdk",
    version="1.0.0",
    author="Lydian AI",
    author_email="support@lydian.ai",
    description="Official Python SDK for Lydian AI Platform",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/lydian/python-sdk",
    project_urls={
        "Documentation": "https://docs.lydian.ai",
        "Source": "https://github.com/lydian/python-sdk",
        "Issue Tracker": "https://github.com/lydian/python-sdk/issues",
    },
    packages=find_packages(where="src"),
    package_dir={"": "src"},
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
        "requests>=2.25.0",
    ],
    extras_require={
        "dev": [
            "pytest>=7.0.0",
            "pytest-cov>=4.0.0",
            "black>=23.0.0",
            "mypy>=1.0.0",
            "flake8>=6.0.0",
        ],
    },
    keywords="lydian ai smart-cities insan-iq lydian-iq api-client",
    license="MIT",
)
