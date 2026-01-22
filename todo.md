# TODO

- Add a Documents panel in wizard/dashboard to list stored exports with download + delete actions.
- Add signed URL downloads (server-side) and retention/cleanup of old exports.
- Add integration tests for `/api/generate/from-intake` with mocked OpenAI client.
- Add schema-level checks for totals (troskovnik vs. iznos) and surface inline warnings.
- Add rate limiting + usage logging for AI calls per user/app.
#


 1.) I want to erase the login and authentication part completely. can we remove it and allow the users to create the form with the form input at the
  beginning? Or should i rewrite the app all together?
 
  In the end i want the app to CTA immediately so that they create their "zahtjevi" immediately, (created zahtjevi are still safed in the Supabase database,
  so if anyone needs to find theirs again, they can ask me.
 
  Is that possible or very much of a hustle?
 
  2.) I need the Text explanation for AI and for input and output to be optimized, i collected useful_links.md and 3 pdfs in the /public folder of this repo, please read them and optimize everything.
 
  3.) I need the landing page to be CTA, with the Form immediately and with 2 CTA buttons at the bottom, left one "Free Zahtjev" generation, generates the
  correct zahtjev with a almost free API model (so i dont waste much money) and right 2€ CTA, that calls to Stripe pay 2€ and then they can generate the same
  thing with the much better models, the best ones. Is this even possible without authentication??
 
  4.) if you scroll below the CTA buttons, i want all the links and from helpful_links and a useful but very clear explantion of what the app is and how it
  works as in the following picture for another app: /home/bruno/Pictures/Screenshots/Screenshot from 2026-01-22 12-49-54.png