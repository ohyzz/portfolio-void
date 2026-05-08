from setuptools import setup

setup(
    name='noise-cli',
    version='1.0.0',
    description='ASCII noise texture generator for the terminal',
    long_description=open('README.md', encoding='utf-8').read(),
    long_description_content_type='text/markdown',
    author='ohyz',
    url='https://github.com/ohyzz/noise-cli',
    py_modules=['noise_cli'],
    entry_points={
        'console_scripts': ['noise=noise_cli:main'],
    },
    python_requires='>=3.7',
    classifiers=[
        'Environment :: Console',
        'Topic :: Terminals',
        'License :: OSI Approved :: MIT License',
    ],
)
