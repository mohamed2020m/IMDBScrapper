# Scrape movies fomr IMDB

```powershell
node scrapper.js
```

By default it will scrappe one movie, and one review for the movie and it won't save the result into a json file.

## additional options

You can add some options, there are three:

- `-m` : This option is to specifiy the number of movie to be scrapped.
- `-r` : This option is to specify the number of reiviews to be scrapped for each movie.
- `-s` : This optio is used to save the result to a json file.

#### Example: 

```powershell
node scrapper.js -m 30 -r 20 -s true
```

## notes
At this momenet the scrapper scrappe data only from the follwing IMDB page: `https://www.imdb.com/chart/top/?ref_=nv_mv_250`




