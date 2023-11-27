# placenameit

Find out which boundaries overlap the given “place”.

[MapIt](https://mapit.mysociety.org) can tell you which boundaries cover a given coordinate or postcode, but what if you _don’t_ have a point like that? What if you have a place name like “Oxford” or multiple place names like “Hereford & Worcester”.

That’s when you need… [placenameit](https://mysociety.github.io/placenameit)!

## Use it online

👉 https://mysociety.github.io/placenameit/

Put your [MapIt API key](https://mapit.mysociety.org) into the box, then press `Load places`.

Select one or more places from the list. You can perform a basic text match search on the place names using the search box – try entering a city or town name, or a county, district, or borough name.

Placenameit will display the places you select, on the map, in blue, along with the boundaries that overlap them, in orange. By default it searches for overlapping `WMC` UK Parliamentary Constituency boundaries, but you can switch to LSOAs or MSOAs if you want.

You can download the list of overlapping boundaries as a table, or plain text (TSV), both of which can be pasted directly into a spreadsheet program like Excel or Google Sheets.

## A note about MapIt API limits

Placenameit does its best to keep MapIt API usage to a minimum (by caching responses, so that subsequent requests for the exact same information never reach the API). But this is _still_ a very API-hungry app, as it makes one API request for each area displayed on the map, another request for each area _type_ selected in the Settings, and another request for each "place" you select, to work out which boundaries overlap it.

[MapIt’s 10,000 requests a month “Village” plan](https://mapit.mysociety.org/pricing/) should be enough for casual use (for example, if you’re geocoding about 500 place names each with 20 matching output boundaries), but if you’re a heavier user, you may need to upgrade to a higher plan. Either way, if your MapIt API quota is reached, Placenameit will tell you.

Placenameit _also_ enforces a 1 second pause between API requests, to respect MapIt’s suggested 1 request per second rate limit.

## Running locally

Requirements:

- [Ruby](https://www.ruby-lang.org/en/documentation/installation/)
- [Bundler](https://bundler.io/#getting-started)

Install all dependencies and get a local server running immediately, in one command:

    script/server

The site will be available at both <http://localhost:4000> and <http://0.0.0.0:4000>.

If you want to serve locally over SSL (recommended) then generate self-signed SSL certificates with:

    script/generate-ssl-certificates

Once the SSL certificates are in place, `script/server` will serve the site over HTTPS, at both <https://localhost:4000> and <https://0.0.0.0:4000>. (You will need to tell your web browser to accept the self-signed certificate.)

You can build the site to `_site` (without serving it) with:

    script/build
