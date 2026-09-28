**DYNAMISK WEB**

# Lav et Pokedex

### **Mål**
Målet med opgaven er at træne listevisning og detaljevisning ved brug af url-parametre(query-strings) samt at opbygge dit brugerinterface med komponenter.

### **Materialer**
Layoutet skal ligne den udleverede Figma fil. Den finder du i 'assets' mappen.

Du kan hente data fra enten pokemon api: https://pokeapi.co/

### **Opgaven**

I listevisning fetches pokemons (`https://pokeapi.co/api/v2/pokemon`), og udskrives med et link rundt om hver pokemon. Ved at klikke på linket, skal brugeren vises en ny side (fx. `detail.html`), som viser mere uddybende detaljer om den enkelte pokemon. Ved hjælp af et url-parameter skal du videresende information til `detail.html` hvilken en af pokemon'erne brugeren har klikket på. På pokemon api'et kan du hente én pokemon ved hjælp af dens navn, så her ser din url måske sådan ud: 
```
http://127.0.0.1:5500/detail.html?name=ivysaur
```

Du skal nu "fiske" navnet ud af url'en og fetche data om `ivysaur` og præsentere Pokemonen på siden.

### **HTML filerne**
HTML-filerne du opretter til projektet skal være stort set tomme. Du skal linke til js-filen for henholdsvis forsiden / listevisningen (index) og detaljesiden. 
I dokumenteres body skal du oprette en div med id'et "root". Det er på denne div du skal tilføje det dynamiske indhold.

### **Processen** 
- Husk at lave en branch til din aflevering.
- Commit ofte
- Tænk over, hvad du skriver i dine commit-beskeder.


### **Aflevering**: 
Du skal aflevere et link på MitRTS.

### **Feedback**: 
Din lærer kigger din aflevering igennem, og hvis du blot får et "godkendt" tilbage betyder det, at du har løst opgaven ligesom det var forventet. 

Hvis din lærer sender et "godkendt" tilbage, men også tilknytter en kommentar, er det måske for at gøre opmærksom på en detalje du let kan forbedre. Du behøver ikke at aflevere igen.

Hvis du derimod får et "ikke godkendt" tilbage fra din lærer, skal du implementere de ændringerne/løse problemet som er beskrevet i kommentaren og lave en ny aflevering. 


# Ekstraopgaver



### **Pokemon api - ekstraopgave 1 - dynamisk baggrundsfarve på detalje-visning**

Tilføj funktionalitet på detalje-visningen som indfarver baggrunden på siden i en farve der svarer til den enkelte Pokemon-type. ?


### **Pokemon api - ekstraopgave 2 - lazy loading af billeder**

Tilføj funktionalitet på liste-visningen som udsætter indlæsningen af billeder indtil de kommer ind i view-porten, så du kun henter billederne på de Pokemon som brugeren rent faktisk scroller til.



### **Pokemon api - ekstraopgave 3 - mulighed for at søge**

Tilføj et søgefelt til index siden, så man ikke skal bladre hen til sin favorit-pokemon. Det kan være du skal bruge et url-parameter til at få fat i søgeresultatet..?


### **Pokemon api - ekstraopgave 4 - infinite scroll**

Tilføj funktionalitet som loader nye Pokemon når du nærmer dig slutningen af de allerede indlæste Pokemon. Følg guiden på MitRTS.




