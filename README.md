# StarTrekTimelinesSpreadsheet
A tool to ease with crew management in Star Trek Timelines

Open Chrome and navigate to Facebook
Hit F12 and switch to the Network tab in the debug pane that opens
Now navigate to Star Trek Timelines on the page and wait until you get the "Play >>" link
Back in the debug page, enter "stt.disruptorbeam.com/player" in the Filter input. Select the first item in the list of requests.
On the right, you should see something like this:

Copy the access_token, which should be in this format: "123e4567-e89b-12d3-a456-426655440000"
