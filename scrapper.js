const request = require("request");
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const fs = require('fs/promises');
const cliProgress = require('cli-progress');
const yargs = require('yargs');

const baseUrl = "https://www.imdb.com";
const url =  "https://www.imdb.com/chart/top/?ref_=nv_mv_250";

const argv = yargs
    .option('save_to_file', {
        alias: 's',
        describe: 'URL to fetch movie details',
        type: 'boolean',
        demandOption: false,
        default : false
    })
    .option('movieLimit', {
        alias: 'm',
        describe: 'URL to fetch movie details',
        type: 'number',
        demandOption: true,
        default : 1
    })
    .option('reviews_limit', {
        alias: 'r',
        describe: 'URL to fetch movie details',
        type: 'number',
        demandOption: true,
        default : 1
    })
    .argv;

    
const movieLimit = argv.movieLimit;
const reviews_limit = argv.reviews_limit;
const save_to_file = argv.save_to_file;

const getHtml = async (url) => {
    return new Promise((resolve, reject) => {
        request(url, (err, res, body) => {
            if (err) {
                reject(err);
            } else {
                resolve(body);
            }
        });
    });
};

// Create a new progress bar
const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);


const parseBody = async (body) => {
    const $ = cheerio.load(body);
    const movieLinks = [];
    const moviesContent = [];

    $("ul.ipc-metadata-list > li").each(function (index) {
        if (index >= movieLimit) {
            return false;
        }
        movieLinks.push($(this).find("div.sc-43986a27-9.gaoUku.cli-title > a").attr("href"));
    });

    // console.log(movieLinks);

    progressBar.start(movieLinks.length, 0);

    for (let i = 0; i < movieLinks.length; i++) {
        const movieURL = baseUrl + movieLinks[i];
        try {
            const movieHtml = await getHtml(movieURL);
            const movie = await parseMovieContent(movieHtml);
            moviesContent.push(movie);
        } catch (err) {
            console.error("Error fetching movie details:", err);
        }finally {
            // Increment the progress bar
            progressBar.increment();
        }
    }

    progressBar.stop(); 

    if(save_to_file){
        await fs.writeFile(`result_${new Date().getMilliseconds().toPrecision(6)}.json`, JSON.stringify(moviesContent ));
    }

    // console.log("All movies processed:", moviesContent);
    // console.dir(moviesContent, { depth: null });

};

const parseMovieContent = async (body) => {
    const $ = cheerio.load(body);
    let movie_actors = [];
    
    // Extract actors
    const children = $("div.ipc-sub-grid.ipc-sub-grid--page-span-2.ipc-sub-grid--wraps-at-above-l.ipc-shoveler__grid").children();
    children.each(function (index, childElement) {
        const childAnchor = $(childElement).find("a.sc-bfec09a1-1");
        movie_actors.push(childAnchor.text());
    });

    
    const movie = {
        title: $("#__next > main > div > section.ipc-page-background.ipc-page-background--base.sc-304f99f6-0.fSJiHR > section > div:nth-child(4) > section > section > div.sc-e226b0e3-3.dwkouE > div.sc-69e49b85-0.jqlHBQ > h1 > span").text().trim(),
        description: $("#__next > main > div > section.ipc-page-background.ipc-page-background--base.sc-304f99f6-0.fSJiHR > section > div:nth-child(4) > section > section > div.sc-e226b0e3-4.dEqUUl > div.sc-e226b0e3-6.CUzkx > div.sc-e226b0e3-10.hbBxmX > section > p > span.sc-466bb6c-0.hlbAws").text().trim(),
        views: $("#__next > main > div > section.ipc-page-background.ipc-page-background--base.sc-304f99f6-0.fSJiHR > section > div:nth-child(4) > section > section > div.sc-e226b0e3-4.dEqUUl > div.sc-e226b0e3-6.CUzkx > div.sc-e226b0e3-11.kkLqLt > div.sc-3a4309f8-0.bjXIAP.sc-69e49b85-5.gnediS > div > div:nth-child(1) > a > span > div > div.sc-bde20123-0.dLwiNw > div.sc-bde20123-3.gPVQxL").text().trim(),
        banner : $("#__next > main > div > section.ipc-page-background.ipc-page-background--base.sc-304f99f6-0.fSJiHR > section > div:nth-child(4) > section > section > div.sc-e226b0e3-4.dEqUUl > div.sc-e226b0e3-5.kIBBK > div.sc-e226b0e3-7.hBYQqs > div > div.ipc-media.ipc-media--poster-27x40.ipc-image-media-ratio--poster-27x40.ipc-media--baseAlt.ipc-media--poster-l.ipc-poster__poster-image.ipc-media__img > img").attr("src"),
        duration: $("#__next > main > div > section.ipc-page-background.ipc-page-background--base.sc-304f99f6-0.fSJiHR > section > div:nth-child(4) > section > section > div.sc-e226b0e3-3.dwkouE > div.sc-69e49b85-0.jqlHBQ > ul > li:nth-child(3)").text().trim(),
        release_date: $("#__next > main > div > section.ipc-page-background.ipc-page-background--base.sc-304f99f6-0.fSJiHR > section > div:nth-child(4) > section > section > div.sc-e226b0e3-3.dwkouE > div.sc-69e49b85-0.jqlHBQ > ul > li:nth-child(1) > a").text().trim(),
        average_rating: $("#__next > main > div > section.ipc-page-background.ipc-page-background--base.sc-304f99f6-0.fSJiHR > section > div:nth-child(4) > section > section > div.sc-e226b0e3-4.dEqUUl > div.sc-e226b0e3-6.CUzkx > div.sc-e226b0e3-11.kkLqLt > div.sc-3a4309f8-0.bjXIAP.sc-69e49b85-5.gnediS > div > div:nth-child(1) > a > span > div > div.sc-bde20123-0.dLwiNw > div.sc-bde20123-2.cdQqzc > span.sc-bde20123-1.cMEQkK").text().trim(),
        director : $("#__next > main > div > section.ipc-page-background.ipc-page-background--base.sc-304f99f6-0.fSJiHR > div > section > div > div.sc-a83bf66d-1.gYStnb.ipc-page-grid__item.ipc-page-grid__item--span-2 > section.ipc-page-section.ipc-page-section--base.sc-bfec09a1-0.jgUBLM.title-cast.title-cast--movie.celwidget > ul > li:nth-child(1) > div > ul > li > a").text().trim(),
        actors :  movie_actors,
        thumbnail : $("#__next > main > div > section.ipc-page-background.ipc-page-background--base.sc-304f99f6-0.fSJiHR > section > div:nth-child(4) > section > section > div.sc-e226b0e3-4.dEqUUl > div.sc-e226b0e3-5.kIBBK > div.sc-e226b0e3-8.cevrfd > div.ipc-slate.ipc-slate--baseAlt.ipc-slate--dynamic-width.sc-248bafc1-0.cFFKvF.undefined.undefined.ipc-sub-grid-item.ipc-sub-grid-item--span-4 > div.ipc-media.ipc-media--slate-16x9.ipc-image-media-ratio--slate-16x9.ipc-media--baseAlt.ipc-media--slate-m.ipc-slate__slate-image.ipc-media__img > img").attr("src"),
    };

    // adding genre
    const genres = [];
    const genres_childrens = $("#__next > main > div > section.ipc-page-background.ipc-page-background--base.sc-304f99f6-0.fSJiHR > section > div:nth-child(4) > section > section > div.sc-e226b0e3-4.dEqUUl > div.sc-e226b0e3-6.CUzkx > div.sc-e226b0e3-10.hbBxmX > section > div.ipc-chip-list--baseAlt.ipc-chip-list > div.ipc-chip-list__scroller").children();
    genres_childrens.each(function(index, childElement){
        const childGenre = $(childElement).find("a > span");
        genres.push(childGenre.text())
    })
    movie.genres = genres; 


    // adding the banner content type
    movie.banner_content_type = getContentType(movie.banner);

    // adding thumbnail content type
    movie.thumbnail_content_type = getContentType(movie.thumbnail);

    // reviews
    let review_url = $("[data-testid='UserReviews']  a").attr("href");
    try {
        // console.log("url: ", baseUrl + review_url);
        const reviewsPageHtml = await getHtml(baseUrl + review_url);
        const reviews = await getReviews(reviewsPageHtml);
        movie.comments = reviews;

    } catch (err) {
        console.error("Error fetching movie reviews: ", err);
    }

    // movie Trailer
    let video_url_page = $("#__next > main > div > section.ipc-page-background.ipc-page-background--base.sc-304f99f6-0.fSJiHR > div > section > div > div.sc-a83bf66d-1.gYStnb.ipc-page-grid__item.ipc-page-grid__item--span-2 > section:nth-child(8) > div.ipc-shoveler.ipc-shoveler--baseAlt.ipc-shoveler--page0 > div.ipc-sub-grid.ipc-sub-grid--page-span-2.ipc-sub-grid--nowrap.ipc-shoveler__grid > div:nth-child(1) > div.ipc-slate.ipc-slate--base.ipc-slate--dynamic-width.ipc-slate-card__slate.ipc-sub-grid-item.ipc-sub-grid-item--span-4 > a").attr("href");
    try{
        movie.video_url = await getTrailerURL(baseUrl + video_url_page);
    }catch(err){
        console.error("Error fetching movie URL: ", err);
    }
    
    return movie;
};


// const getVideoURL = async (body) => {
//     const $ = cheerio.load(body); 
    
//     let videoElement =  $("[data-testid='video-page-player']")

//     if (videoElement.length > 0) {
//         const videoUrl = videoElement.attr("src");
//         console.log("Video URL:", videoUrl);
//         return videoElement;
//     } else {
//         console.log("Video element not found");
//     }
//     return null;
// }


// we will use puppeteer to get the video urll
const getTrailerURL = async (url) => {
    const browser = await puppeteer.launch({ 
        headless: 'new',
        args: ['--no-sandbox'],
        defaultViewport: null,
        args: ['--start-maximized'],
        ignoreHTTPSErrors: true, 
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    await page.goto(url);
    await page.waitForSelector('#imdbnext-vp-jw-single > div.jw-wrapper.jw-reset > div.jw-media.jw-reset > video');

    // Extract the content
    const content = await page.evaluate(() => {
        const videoElement = document.querySelector('#imdbnext-vp-jw-single > div.jw-wrapper.jw-reset > div.jw-media.jw-reset > video');
        if (videoElement) {
            return videoElement.getAttribute('src');
        } else {
            return null;
        }
    });

    await browser.close();

    return content;
};


// getting reviews
const getReviews = async (body) => {
    const $ = cheerio.load(body); 
    let reviews = [];

    $("#main > section > div.lister > div.lister-list > div").each(function(index) {
        if( index >= reviews_limit){
            return false;
        }

        const review = {
            rating: $(this).find(`div.review-container > div.lister-item-content > div.ipl-ratings-bar > span > span:nth-child(2)`).text(),
            title : $(this).find(`div.review-container > div.lister-item-content > a`).text(),
            content: $(this).find(`div.review-container > div.lister-item-content > div.content > div.text.show-more__control`).text(),
            created_date : $(this).find(`div.review-container > div.lister-item-content > div.display-name-date > span.review-date`).text(),
            author : $(this).find(`div.review-container > div.lister-item-content > div.display-name-date > span.display-name-link > a`).text()
        }

        reviews.push(review);
    })
    
    // console.log(reviews);
    return reviews;
}

const getContentType = (url) => {
    const extension = url.split('.').pop().toLowerCase();
    switch (extension) {
        case 'jpg':
        case 'jpeg':
            return 'image/jpeg';
        case 'png':
            return 'image/png';
        case 'gif':
            return 'image/gif';
        default:
            return 'unknown';
    }
};

getHtml(url).then((body) => parseBody(body)).catch((err) => console.error("Error fetching movie links:", err));


// this fuction responsible for converting from url to blob (it will be used later in reactJs)
async function imageUrlToBlob(imageUrl) {
    // Fetch the image as a binary stream
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    return blob;
}