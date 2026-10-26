# US zip directory

`us.json` answers one question: is this a real US zip code? It holds a bitmap with one bit for every possible 5-digit zip, built from the GeoNames US postal codes by `build.mjs` in this folder. Rebuild it a couple of times a year, since zips are added and retired.

Contains data from GeoNames (www.geonames.org), licensed under CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/).
