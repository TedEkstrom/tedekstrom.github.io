# Word-guide → HTML-guide

    pip install python-docx
    python docx2guide.py MinGuide.docx        # skapar guide.json, guide.js och media/
    # öppna index.html

`guide.config.json` (valfri) sätter kurs, meta, författare och rubriker. `infoSections` / `stepSections`
(lista med delar av rubriktexter) tvingar en sektion att vara ren information respektive stegsektion.

## Hur Word tolkas
- Rubrik 1 = guidens titel, Rubrik 2 = sektion. Sektioner med steg blir delar med bockrutor och räknare.
- Listpunkter på översta nivån = steg när sektionen har numrerad lista, nästlade nivåer eller minst 7 punkter. Djupare nivåer blir underlistor i steget.
- Stycke direkt före en stegserie (efter första steget) = underrubrik.
- Kod: teckensnitt Consolas/Courier New eller stilen "Kod" (flera rader i följd = ett block med Kopiera-knapp). Stycket "Kör på srv01:" före ett kodblock blir blockets etikett.
- Stycke som börjar med Obs/Notera/Tips = notisruta.
- Förklaringsruta: skriv `DNS{{Domain Name System. Översätter namn till IP.}}` i texten.
- Bilder extraheras till media/, tabeller blir tabeller.
- Steg-ID bygger på sektion + steget text, så bockarna överlever att du lägger till steg.

## Övningsläge (t.ex. Laboration 2)
Aktiveras automatiskt när dokumentet har rubrikerna "Översikt" och "Detaljsteg" (stilen Underrubrik/Subtitle).
- Rubrik 1 = kapitel (övning), Rubrik 2 = del (t.ex. labbsal eller delmoment).
- Före första Rubrik 1: första två Underrubrikerna = kurs och titel, stycken under dem = författare/meta.
- Syfte och bakgrund → hopfälld ruta (stängd). Översikt → hopfälld sammanfattning (öppen, utan bockrutor).
- Detaljsteg: stycken som börjar med `(1)`, `(2)` … blir de bockbara stegen. Stycken utan nummer hör till steget ovanför.
- Formatering enligt dokumentets Strukturförklaring: kursiv = plats/läge, småkapitäler = tangent/knapp, monospace = inmatning, `<…>` = placeholder.
- Textrutor med löptext blir notisrutor. Nätverksskisser (ritade i Word) ritas upp som SVG, förenklat.
- Tomma "sidan har lämnats tom"-sidor hoppas över.

## PDF som indata
    py -m pip install pdfplumber
    py .\docx2guide.py MinGuide.pdf

PDF saknar Words stilar, så strukturen tolkas ur teckenstorlek, typsnitt och läge. Resten av flödet är detsamma som för Word.
- Fetstilta rubriker som bara är ~1 pt större än brödtexten (t.ex. 11 pt mot 10 pt, som när Word exporterar Rubrik 2) räknas som rubriker.
  Fetstilta korta stycken utan slutpunkt och rader som "Uppgift 2G" blir underrubriker, precis som i Word-läget.
- Radavståndet i PDF:en mäts upp och styr var ett nytt stycke börjar. En rad som slutar på kolon avslutar stycket.
- Text före titeln (fakultet, program, kurs) i en vanlig guide blir `course`; datum och sidnummer släpps.
- Nivå 2-punkter (Courier-"o") och punkter i Symbol-typsnitt känns igen. Logotyper i vänstermarginalen sparas inte.
- Största rubrikstorleken = kapitel, näst största = del, övriga större än brödtext = underrubriker (Översikt, Detaljsteg …).
  Är första sidan en titelsida (två eller fler rader i största storleken) behandlas de raderna som kurs och titel.
  Kan ställas in manuellt: `"pdfHeadingSizes": {"h1": 20, "h2": 17, "sub": 14}` i guide.config.json.
- Prefix som "Övning 1:" och "Delmoment 2:" tas bort ur rubriker (`headingStrip` i konfigurationen).
- Monospace-typsnitt (Consolas, Courier, Cascadia …) = kod/inmatning. Kursiv och fetstil följer typsnittet.
  Småkapitäler känns igen på uppskalade versaler i mindre storlek och blir tangent/knapp.
- Listor känns igen på punkt- eller sifferprefix, med nivå efter indrag. Stycken som börjar med (1), (2) … blir steg.
- Sidhuvud, sidfot, sidnummer, innehållsförteckning och sidor "lämnade tomma" tas bort.
- Tabeller med linjer blir tabeller. Kantade rutor blir notisrutor. Ritade skisser och bilder sparas som bilder i media/ (inte som SVG).
- Skrivs PDF:en ut från Word utan taggning kan enstaka radbrytningar eller tabellgränser bli fel. Kontrollera resultatet.

## Fetstilta rubriker och uppgifter (Word)
- Ett kort stycke som är helt fetstilt (utan punkt i slutet) tolkas som underrubrik. Följs det av steg blir det en stegrubrik inom delen. Följs det inte av några listpunkter (t.ex. "Godkänt uppgifter") blir det ett eget avsnitt.
- Korta stycken som "Uppgift 2A" / "Fråga 3" blir underrubriker.
- Sektioner vars rubrik innehåller förutsättning, innehåller, rapport, uppgifter, inledning, bakgrund eller syfte räknas aldrig som stegsektioner. Ändra listan med `infoSections` i guide.config.json.

## Logotyper
`media/hkr-logo.png` (kort HKR) ligger högst upp i sidopanelen, och i topplisten på smala skärmar. `media/hkr-ord.png` (Högskolan Kristianstad / Kristianstad University, transparent) ligger längst ner i sidopanelen, och som sidfot på smala skärmar och vid utskrift. Byt ut filerna för att byta logotyp; en vektorversion (SVG) ger skarpare resultat än PNG.
