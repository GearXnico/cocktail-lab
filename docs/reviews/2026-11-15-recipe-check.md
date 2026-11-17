# Recipe check and candidate lists

Prepared for step 17 of the [v1 plan](../design/v1.md): the 31 recipes in `data/recipes/` compared with their sources, and the candidates for the families still to fill. This is a report. No file in `data/` was changed.

## How it was done

- Sources follow [ADR 0007](../adr/0007-recipe-sources-iba-then-diffords-guide.md): the IBA first, Difford's Guide when the IBA has no spec, and a published Chilean source for regional drinks neither covers.
- Each recipe was looked up on its own page, one page per recipe, on 2026-11-14. Only measures, ingredients, glass, ice, technique and garnish were taken.
- The pages were read through a tool that returns a summary of the page, not the page itself. Re-read a value on the source page before it goes into `data/`.
- Amounts are in ml unless a unit is given. A teaspoon is written as a barspoon (5 ml in `core`). "A few drops" and "top up" are kept as the source writes them.
- Not done: the 27 IBA-sourced recipes were not also compared with Difford's Guide. Not readable: `chileanfoodandgarden.com` answers 403 to the tool, and Difford's community recipes hide their method from visitors.

## Part 1: the 31 existing recipes

27 recipes cite an IBA page and were compared with it. 4 Chilean recipes have no `sources` and were checked for internal consistency only. Each table lists only what differs.

Result: no ingredient amount in the 27 IBA-sourced recipes differs from its source. There are 10 differences in the IBA-sourced recipes, most of them a choice of serve, and 7 consistency findings in the Chilean ones.

### Sours

| Recipe | Field | In `data/` | Source says | Recommendation |
| --- | --- | --- | --- | --- |
| [whiskey-sour](https://iba-world.com/iba-cocktail/whiskey-sour/) | Glass and ice | `rocks`, `cubes` | A cobbler glass, served without ice; an old fashioned glass filled with ice is the "on the rocks" option | Keep: the IBA allows it and the steps already say so. Change only if you want the IBA's first serve (a stemmed glass, no ice) |
| [whiskey-sour](https://iba-world.com/iba-cocktail/whiskey-sour/) | Ingredient | No egg white | A few drops of egg white, optional | Keep it out of `ingredients`; mention it in the steps as optional |

No differences: daiquiri, last-word, margarita, sidecar.

### Spirit-forward

No differences: dry-martini, manhattan, negroni, old-fashioned, sazerac.

Two readings to confirm, not differences: the Old Fashioned's "a few dashes" of bitters and of water are stored as 3 dashes each, and the Sazerac's 10 ml of absinthe is a rinse that is partly discarded but is costed in full.

### Highballs & Collins

| Recipe | Field | In `data/` | Source says | Recommendation |
| --- | --- | --- | --- | --- |
| [paloma](https://iba-world.com/iba-cocktail/paloma/) | Ingredient | Salt only in the steps | A pinch of salt is in the ingredient list | Leave as is unless you want a `salt` ingredient in the catalogue; its cost is negligible |

No differences: cuba-libre, john-collins, mojito, moscow-mule. The Mojito's soda has no amount at the IBA; the 60 ml `topUp` in the data is the estimate the design allows.

### Sparkling & spritz

| Recipe | Field | In `data/` | Source says | Recommendation |
| --- | --- | --- | --- | --- |
| [french-75](https://iba-world.com/iba-cocktail/french-75/) | Measure | Champagne 60 ml with `topUp: true` | A measured 60 ml | Remove `topUp`: in the design it only means the amount is approximate. Use `into: 'glass'` once step 14 adds it |
| [champagne-cocktail](https://iba-world.com/iba-cocktail/champagne-cocktail/) | Ingredient | No Grand Marnier | A few drops of Grand Marnier, optional | Keep it out; mention it in the steps as optional |

No differences: aperol-spritz, bellini, mimosa. The IBA calls the drink "Spritz" and lists Aperol as its ingredient; the name "Aperol Spritz" is ours.

### Tiki & tropical

| Recipe | Field | In `data/` | Source says | Recommendation |
| --- | --- | --- | --- | --- |
| [mai-tai](https://iba-world.com/iba-cocktail/mai-tai/) | Ice and technique | `ice: crushed`; the steps say "strain" and never add ice to the glass | Shake with ice and pour into the glass; no ice is named for the glass | Make the field and the steps agree: either pour unstrained with the shaking ice (`cubes`), or keep `crushed` and add it in the steps. You decide which serve |
| [planters-punch](https://iba-world.com/iba-cocktail/planters-punch/) | Glass and ice | `rocks`, `cubes` | A small tumbler or a terracotta cup; ice is one of three optional ways to dilute | Keep `rocks`. Decide whether `ice` should be `none`. This IBA spec (rum, lime, sugar cane juice) is far from how the drink is usually made, so it is a candidate for the "outdated spec" rule of ADR 0007 |

No differences: jungle-bird, pina-colada, zombie. The Zombie's 6 drops of Pernod are stored as 0.3 ml and its teaspoon of grenadine as 5 ml.

### Latin American

Compared with the IBA:

| Recipe | Field | In `data/` | Source says | Recommendation |
| --- | --- | --- | --- | --- |
| [caipirinha](https://iba-world.com/iba-cocktail/caipirinha/) | Ice | `crushed` | Cracked ice | Keep: the schema has no cracked ice and `crushed` is the nearest |
| [pisco-sour-peruvian](https://iba-world.com/iba-cocktail/pisco-sour/) | Glass | `coupe` | A chilled goblet | Keep: the schema has no goblet |
| [pisco-sour-peruvian](https://iba-world.com/iba-cocktail/pisco-sour/) | Ingredient | `lemon-juice` | Fresh lemon juice | The data follows the IBA. The design's citrus rule gives "limón sutil" its own ingredient, `key-lime-juice`, and that is the fruit this recipe is made with in Peru. Decide which rule wins |

Chilean recipes without a source, checked for consistency only:

| Recipe | Field | In `data/` | Finding | Recommendation |
| --- | --- | --- | --- | --- |
| pisco-sour-chilean | Measures and glass | 90 + 30 + 30 = 150 ml in a `coupe` | By my estimate the water from shaking brings it to about 180 ml or more, over a usual coupe (150 to 180 ml) | Scale to 60 + 20 + 20 (same 3:1:1), or name a larger glass |
| pisco-sour-chilean | Ingredient | `lemon-juice` | The design gives the "limón de Pica" its own ingredient, `key-lime-juice`, and this is the recipe that uses it | Add `key-lime-juice` to the catalogue and use it here |
| pisco-sour-chilean | Source | None | Difford's has a "Pisco Sour (Chilean way)", but it is an unverified community recipe with egg white | Not usable under ADR 0007; cite a Chilean source |
| terremoto | Measure | Pipeño 200 ml `topUp`, grenadine 22.5 ml, `collins` | The 200 ml fits a glass of about 300 ml with the scoop. A published Chilean recipe ([La Tercera](https://www.latercera.com/practico/noticia/5-tragos-chilenos-y-como-prepararlos/EWUJHQ6CTBFPLGXZUZSZCOFAGM/)) gives 250 ml in a half-litre glass, 2 tablespoons of ice cream, a splash of grenadine and 60 ml of fernet | Decide the glass size the estimate assumes, and whether the fernet belongs. That article can be the recipe's source |
| terremoto | Ingredient order | Grenadine listed before the pipeño | The steps add the grenadine last | Already planned in step 15; listed here so it is not lost |
| vaina-chilena | Measure | `egg-yolk` 0.5 unit | Half a yolk cannot be measured at the bar and costs oddly. The total (about 130 ml) fits the glass | Use 1 yolk, or confirm the half against a source |
| pantera-rosa, vaina-chilena | Source | None | Difford's "Pantera Rosa" is a different drink (gin, raspberries, limoncello) and its "Vaina" is a community recipe with Scotch and coffee liqueur | Neither is usable; cite a Chilean source |

No finding: the Pantera Rosa's measures (120 ml) fit its cocktail glass.

## Part 2: candidate lists

72 candidates: 3 plus 2 alternates for each original family, 5 plus 2 alternates for each new one. None repeats a recipe in `data/` or in another family.

How to read the tables:

- **#** is 1 to 5 for the proposed list and A1, A2 for the alternates.
- **Recipe** gives the name and the proposed id. The Spanish name is given only when it differs. **(Chilean)** marks the drinks you asked to decide on.
- **Base · technique · glass · ice** use schema values, including the new `heat`, `mug`, `julep-cup`, `pint` and `shot`. A value the source names but the schema lacks is explained under the table.
- **Missing** lists ingredients not in `data/ingredients.json`, as proposed ids.
- **Why** ends with a flag in bold when the drink's status as a classic, or its fit, is in doubt.

### Sours (3 more)

| # | Recipe | Base · technique · glass · ice | Spec | Garnish | Source | Missing | Why |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | White Lady `white-lady` | gin · shake · cocktail · none | Gin 40, triple sec 30, lemon juice 20 | None | [IBA](https://iba-world.com/iba-cocktail/white-lady/) | None | The gin member of the Sidecar and Margarita pattern: spirit, triple sec, citrus |
| 2 | Clover Club `clover-club` | gin · shake · cocktail · none | Gin 45, raspberry syrup 15, lemon juice 15, egg white a few drops | Fresh raspberries | [IBA](https://iba-world.com/iba-cocktail/clover-club/) | `raspberry-syrup` | A pre-Prohibition egg-white sour; gives the family a second foam drink |
| 3 | New York Sour `new-york-sour` | whisky · shake · rocks · cubes | Rye or bourbon 60, lemon juice 30, simple syrup 22.5, egg white a few drops, red wine 15 floated | Lemon or orange zest and a cherry | [IBA](https://iba-world.com/iba-cocktail/new-york-sour/) | `red-wine` | A whiskey sour with a wine float, the first use of a float (`into: 'glass'`) |
| A1 | Bee's Knees `bees-knees` | gin · shake · cocktail · none | Gin 52.5, honey syrup 2 barspoons, lemon juice 22.5, orange juice 22.5 | Lemon or orange zest, optional | [IBA](https://iba-world.com/iba-cocktail/bees-knees/) | `honey-syrup` | A Prohibition-era sour sweetened with honey |
| A2 | Aviation `aviation` | gin · shake · cocktail · none | Gin 45, maraschino 15, lemon juice 15, crème de violette 1 barspoon | Maraschino cherry, optional | [IBA](https://iba-world.com/iba-cocktail/aviation/) | `creme-de-violette` | A 1910s sour with a colour of its own (pale violet) |

### Spirit-forward (3 more)

| # | Recipe | Base · technique · glass · ice | Spec | Garnish | Source | Missing | Why |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Boulevardier `boulevardier` | whisky · stir · cocktail · none | Bourbon or rye 45, Campari 30, sweet vermouth 30 | Orange zest | [IBA](https://iba-world.com/iba-cocktail/boulevardier/) | None | The whiskey counterpart of the Negroni, served up |
| 2 | Martinez `martinez` | gin · stir · cocktail · none | Gin 45, sweet vermouth 45, maraschino 1 barspoon, orange bitters 2 dashes | Lemon zest | [IBA](https://iba-world.com/iba-cocktail/martinez/) | `orange-bitters` | The link between the Manhattan and the Dry Martini |
| 3 | Vieux Carré `vieux-carre` | whisky · stir · cocktail · none | Rye 30, cognac 30, sweet vermouth 30, Bénédictine 1 barspoon, Peychaud's 2 dashes | Orange zest and a maraschino cherry | [IBA](https://iba-world.com/iba-cocktail/vieux-carre/) | `benedictine` | A New Orleans classic next to the Sazerac, on two base spirits |
| A1 | Hanky Panky `hanky-panky` | gin · stir · cocktail · none | Gin 45, sweet vermouth 45, fernet 7.5 | Orange zest | [IBA](https://iba-world.com/iba-cocktail/hanky-panky/) | `fernet-branca` | A sweet Martini with a bitter accent |
| A2 | Rusty Nail `rusty-nail` | whisky · build · rocks · cubes | Scotch 45, Drambuie 25 | Lemon zest | [IBA](https://iba-world.com/iba-cocktail/rusty-nail/) | `scotch-whisky`, `drambuie` | Two ingredients over ice; brings Scotch into the catalogue |

### Highballs & Collins (3 more)

| # | Recipe | Base · technique · glass · ice | Spec | Garnish | Source | Missing | Why |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Dark 'n' Stormy `dark-n-stormy` | rum · build · highball · cubes | Ginger beer 100, then dark rum 60 floated on top | Lime wedge or slice | [IBA](https://iba-world.com/iba-cocktail/dark-n-stormy/) | `black-rum`, unless `jamaican-dark-rum` is reused | A two-tone highball: the rum floats over the ginger beer |
| 2 | Gin Fizz `gin-fizz` | gin · shake · highball · none | Gin 45, lemon juice 30, simple syrup 10, soda water a splash | Lemon slice | [IBA](https://iba-world.com/iba-cocktail/gin-fizz/) | None | The fizz: shaken, then topped with soda and served without ice, unlike the Collins |
| 3 | Tequila Sunrise `tequila-sunrise` | tequila · build · highball · cubes | Tequila 45, orange juice 90, grenadine 15 added last and not stirred | Half an orange slice | [IBA](https://iba-world.com/iba-cocktail/tequila-sunrise/) | None | A layered highball, built from ingredients already in the catalogue |
| A1 | Horse's Neck `horses-neck` | brandy · build · highball · cubes | Cognac 40, ginger ale 120, Angostura a dash (optional) | A spiral of lemon rind | [IBA](https://iba-world.com/iba-cocktail/horses-neck/) | `ginger-ale` | The brandy highball, known by its long lemon spiral |
| A2 | Gin tonic / Gin and Tonic `gin-and-tonic` | gin · build · collins · cubes | Gin 50, tonic water 120 | Lime wedge | [Difford's](https://www.diffordsguide.com/cocktails/recipe/835/gin-and-tonic) | `tonic-water` | The best-known highball; the IBA has no spec for it |

### Sparkling & spritz (3 more)

| # | Recipe | Base · technique · glass · ice | Spec | Garnish | Source | Missing | Why |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Kir Royal `kir-royal` | sparkling-wine · build · flute · none | Crème de cassis 10, Champagne 90 | None | [IBA](https://iba-world.com/iba-cocktail/kir/), as the variation of the Kir; [Difford's](https://www.diffordsguide.com/cocktails/recipe/1109/kir-royale) gives 15 and 120 with a berry | `creme-de-cassis` | The French sparkling aperitif. **The IBA gives it one line under the Kir; the two sources differ in size, not in ratio** |
| 2 | Old Cuban `old-cuban` | rum · shake · cocktail · none | Aged rum 45, lime juice 22.5, simple syrup 30, Angostura 2 dashes, mint leaves 6 to 8, sparkling wine 60 on top | Mint sprigs | [IBA](https://iba-world.com/iba-cocktail/old-cuban/) | `aged-rum`, unless `gold-puerto-rican-rum` is reused | A Mojito lengthened with sparkling wine. **Modern: credited to a bartender in the 2000s (not stated on the IBA page); IBA-listed** |
| 3 | Hugo `hugo-spritz` | sparkling-wine · build · wine · cubes | Elderflower liqueur 40, prosecco 60, soda water 60, mint leaves 8 | Lime wedge and a mint sprig | [Difford's](https://www.diffordsguide.com/cocktails/recipe/5039/hugo-spritz) | `elderflower-liqueur` | The Alpine spritz, the usual companion of the Aperol Spritz. **Doubtful as a classic: Difford's credits it to Roland Gruber, 2005** |
| A1 | Russian Spring Punch `russian-spring-punch` | vodka · shake · collins · cubes | Vodka 25, lemon juice 25, crème de cassis 15, sugar syrup 10, sparkling wine to top up | Blackberries | [IBA](https://iba-world.com/iba-cocktail/russian-spring-punch/) | `creme-de-cassis` | A tall sparkling sour. **Modern: a bartender's drink of the 1980s (not stated on the IBA page); IBA-listed** |
| A2 | Ponche a la romana `ponche-a-la-romana` **(Chilean)** | sparkling-wine · build · flute · none | Pineapple ice cream 1 scoop, sparkling wine about 120 to top up | None | [La Tercera](https://www.latercera.com/practico/noticia/5-tragos-chilenos-y-como-prepararlos/EWUJHQ6CTBFPLGXZUZSZCOFAGM/): a batch of 750 ml sparkling wine, 300 ml pineapple chunks and 2 to 3 tablespoons of ice cream | None | The Chilean New Year drink; it reuses the Terremoto's floating scoop. **The per-glass amounts are my conversion of a batch recipe** |

### Tiki & tropical (3 more)

| # | Recipe | Base · technique · glass · ice | Spec | Garnish | Source | Missing | Why |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Singapore Sling `singapore-sling` | gin · shake · collins · cubes | Gin 30, cherry liqueur 15, triple sec 7.5, Bénédictine 7.5, pineapple juice 120, lime juice 15, grenadine 10, Angostura a dash | Pineapple and a maraschino cherry | [IBA](https://iba-world.com/iba-cocktail/singapore-sling/) | `cherry-liqueur`, `benedictine` | The tropical classic on gin; the family is all rum today |
| 2 | Three Dots and a Dash `three-dots-and-a-dash` | rum · blend · tiki-mug · crushed | Rhum agricole 45, blended aged rum 15, falernum 7.5, allspice dram 7.5, lime juice 15, orange juice 15, honey syrup 15, Angostura 2 dashes | Three cherries and a chunk of pineapple | [IBA](https://iba-world.com/iba-cocktail/three-dots-and-a-dash/) | `martinique-agricole-rhum`, `aged-rum`, `allspice-dram`, `honey-syrup` | A spiced tiki drink on two rums, and a use for `tiki-mug`, which no recipe has |
| 3 | Queen's Park Swizzle `queens-park-swizzle` | rum · swizzle · collins · crushed | Light gold rum 60, lime juice 22.5, demerara syrup (2:1) 15, Angostura 2 dashes, mint leaves 8 | Lime wedge and a mint sprig | [Difford's](https://www.diffordsguide.com/cocktails/recipe/2740/queens-park-swizzle) | None if `gold-puerto-rican-rum` is reused | From the Queen's Park Hotel in Trinidad; the only candidate that uses `swizzle`, which no recipe has |
| A1 | Painkiller `painkiller` | rum · shake · tiki-mug · cubes | Navy rum 45, pineapple juice 90, orange juice 22.5, cream of coconut 15 | Grated nutmeg and a pineapple wedge | [Difford's](https://www.diffordsguide.com/cocktails/recipe/1454/painkiller) | `navy-rum` | A Piña Colada relative from the British Virgin Islands. **The name is a trademark of a rum brand, and the drink comes from one bar** |
| A2 | Missionary's Downfall `missionarys-downfall` | rum · blend · coupe · crushed | White rum 30, peach brandy 15, lime juice 15, honey mix 30, mint leaves 10, pineapple chunks 3 to 4 | Mint sprig and a pineapple slice | [IBA](https://iba-world.com/iba-cocktail/missionarys-downfall/) | `peach-brandy`, `honey-syrup`, `pineapple` | A blended tiki drink with fresh mint and fruit |

The IBA serves the Singapore Sling in a hurricane glass and the Three Dots and a Dash in a footed glass; the schema has neither, so `collins` and `tiki-mug` are the nearest.

### Latin American (3 more)

| # | Recipe | Base · technique · glass · ice | Spec | Garnish | Source | Missing | Why |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Chilcano `chilcano` | pisco · build · collins · cubes | Pisco 60, lime juice 7.5, bitters 3 dashes, ginger ale 105 | Lime wedge | [Difford's](https://www.diffordsguide.com/cocktails/recipe/3490/chilcano-de-pisco) | `ginger-ale`; the source names a Peruvian bitters, so `angostura-bitters` or a new id | Peru's pisco highball, the everyday partner of its pisco sour |
| 2 | Piscola `piscola` **(Chilean)** | pisco · build · collins · cubes | Chilean pisco 60, cola 110 | Lime wedge | [Difford's](https://www.diffordsguide.com/cocktails/recipe/1564/piscola) | None | Chile's most common mixed drink. The source's 2 dashes of Angostura are optional and left out |
| 3 | Fernandito `fernandito` | aperitif · build · rocks · cubes | Fernet 50, cola to fill | None | [IBA](https://iba-world.com/iba-cocktail/fernandito/) | `fernet-branca` | Argentina's fernet and cola; adds a third country to the family |
| A1 | Canchánchara `canchanchara` | rum · build · rocks · crushed | Cuban aguardiente 60, lime juice 15, honey 15, water 50 | Lime wedge | [IBA](https://iba-world.com/iba-cocktail/canchanchara/) | `cuban-aguardiente`, `honey` | An old Cuban drink of aguardiente, honey and lime. The IBA names no glass; `rocks` is my choice |
| A2 | Borgoña `borgona` **(Chilean)** | wine · build · wine · cubes | Red wine 150, strawberries 100 g, sugar 1 barspoon | None | [La Tercera](https://www.latercera.com/practico/noticia/5-tragos-chilenos-y-como-prepararlos/EWUJHQ6CTBFPLGXZUZSZCOFAGM/): a batch of 1 bottle of red wine, 500 g of strawberries, sugar to taste | `red-wine`, `strawberries` | The Fiestas Patrias wine and strawberry drink. **The per-glass amounts are my conversion of a batch recipe** |

### Coffee & after-dinner (5)

| # | Recipe | Base · technique · glass · ice | Spec | Garnish | Source | Missing | Why |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Espresso Martini `espresso-martini` | vodka · shake · cocktail · none | Vodka 50, coffee liqueur 30, sugar syrup 10, espresso 1 strong shot | 3 coffee beans | [IBA](https://iba-world.com/iba-cocktail/espresso-martini/) | `coffee-liqueur`, `espresso` | The coffee cocktail people ask for most. **Modern: a bartender's drink of the 1980s (not stated on the IBA page); IBA-listed** |
| 2 | Black Russian `black-russian` | vodka · build · rocks · cubes | Vodka 50, coffee liqueur 20 | None | [IBA](https://iba-world.com/iba-cocktail/black-russian/) | `coffee-liqueur` | The simplest after-dinner drink; the IBA gives the White Russian as its variation with cream |
| 3 | Alexander `alexander` | brandy · shake · cocktail · none | Cognac 30, brown crème de cacao 30, fresh cream 30 | Grated nutmeg | [IBA](https://iba-world.com/iba-cocktail/alexander/) | `cream` | The classic cream cocktail |
| 4 | Grasshopper `grasshopper` | no base fits · shake · cocktail · none | White crème de cacao 20, green crème de menthe 20, fresh cream 20 | Mint leaf, optional | [IBA](https://iba-world.com/iba-cocktail/grasshopper/) | `creme-de-menthe`, `cream`, and a white `creme-de-cacao` if the two colours are kept apart | The mint and chocolate dessert drink, green in the glass. **No spirit base: see open question 2** |
| 5 | Cola de mono `cola-de-mono` **(Chilean)** | brandy · heat · rocks · none | Per batch in the recipes seen: 1 litre of milk, about 240 ml of aguardiente, 1 cup of sugar, instant coffee, cinnamon, cloves | None | No source read in full. [Pilar's Chilean Food & Garden](https://www.chileanfoodandgarden.com/chilean-coffee-eggnog/) has the recipe, but the page could not be read | `aguardiente`, `milk`, `coffee`, `cinnamon-stick`, `cloves` | Chile's Christmas milk and coffee punch, served cold. **Needs a source you accept and a per-glass conversion. Difford's version is its own adaptation with coffee liqueur, not the traditional drink** |
| A1 | B-52 `b-52` | no base fits · build · shot · none | Coffee liqueur 15, Irish cream 15, Grand Marnier 15, layered in that order | None | [Difford's](https://www.diffordsguide.com/cocktails/recipe/133/b-52-shot) | `coffee-liqueur`, `irish-cream`, `grand-marnier` | The layered shot; a use for `shot` and `layered`. **Difford's credits it to a bartender, 1977** |
| A2 | Carajillo `carajillo` | no base fits · build · rocks · cubes | Licor 43 45, hot espresso 45 floated on top | 3 coffee beans | [Difford's](https://www.diffordsguide.com/cocktails/recipe/4848/carajillo-puesto) | `licor-43`, `espresso` | The Spanish and Mexican coffee and liqueur drink |

### Juleps & smashes (5)

| # | Recipe | Base · technique · glass · ice | Spec | Garnish | Source | Missing | Why |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Mint Julep `mint-julep` | whisky · build · julep-cup · crushed | Bourbon 60, mint sprigs 4, powdered sugar 1 barspoon, water 2 barspoons | Mint sprig | [IBA](https://iba-world.com/iba-cocktail/mint-julep/) | None | The drink the family is named after. The IBA says cracked ice |
| 2 | Whiskey Smash `whiskey-smash` | whisky · shake · rocks · cubes | Bourbon 60, lemon juice 22.5, sugar syrup (2:1) 15, mint leaves 8 | Lemon wheel and mint sprigs | [Difford's](https://www.diffordsguide.com/cocktails/recipe/3347/whiskey-smash) | None | The smash: a short julep with citrus |
| 3 | Gin Basil Smash `gin-basil-smash` | gin · shake · cocktail · none | Gin 60, lemon juice 22.5, sugar syrup 22.5, basil leaves 10 | None | [IBA](https://iba-world.com/iba-cocktail/gin-basil-smash/) | `basil` | A smash on basil instead of mint, green in the glass. **Modern: credited to a bartender in 2008 (not stated on the IBA page); IBA-listed. The IBA serves it up, though it is usually seen on ice** |
| 4 | South Side `south-side` | gin · shake · cocktail · none | Gin 60, lemon juice 30, simple syrup 15, mint leaves 5 to 6 | Mint sprigs | [IBA](https://iba-world.com/iba-cocktail/south-side/) | None | Gin shaken with mint. **A mint sour served up more than a smash; it fits by its ingredients** |
| 5 | Prescription Julep `prescription-julep` | brandy · shake · julep-cup · crushed | Cognac 45, rye 15, demerara syrup (2:1) 7.5, orange bitters 2 dashes, mint leaves 7 | Mint sprig dusted with icing sugar | [Difford's](https://www.diffordsguide.com/cocktails/recipe/4629/prescription-julep) | `orange-bitters` | A julep on cognac and rye instead of bourbon |
| A1 | Brandy Smash `brandy-smash` | brandy · shake · rocks · large-cube | Cognac 60, sugar syrup (2:1) 7.5, mint leaves 7 | Mint sprigs | [Difford's](https://www.diffordsguide.com/cocktails/recipe/315/brandy-smash) | None | The smash of Jerry Thomas's 1862 guide; a use for `large-cube` |
| A2 | Sherry Cobbler `sherry-cobbler` | wine · shake · julep-cup · crushed | Amontillado 45, palo cortado 45, sugar 1 barspoon, half an orange wheel, half a lemon wheel | Berries, a quarter orange wheel and a quarter lemon wheel | [IBA](https://iba-world.com/iba-cocktail/sherry-cobbler/) | `amontillado-sherry`, `palo-cortado-sherry`, `orange`, `lemon` | Same cup and crushed ice as the julep. **A cobbler, not a julep or a smash** |

### Aperitivo (5)

| # | Recipe | Base · technique · glass · ice | Spec | Garnish | Source | Missing | Why |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Americano `americano` | aperitif · build · rocks · cubes | Campari 30, sweet vermouth 30, soda water a splash | Half an orange slice and lemon zest | [IBA](https://iba-world.com/iba-cocktail/americano/) | None | The original low-alcohol aperitivo drink |
| 2 | Garibaldi `garibaldi` | aperitif · build · highball · cubes | Campari 45, orange juice 120 | Orange wedge | [IBA](https://iba-world.com/iba-cocktail/garibaldi/) | None | Bitter and orange juice, two ingredients already in the catalogue |
| 3 | Negroni Sbagliato `negroni-sbagliato` | aperitif · build · rocks · cubes | Sweet vermouth 30, Campari 30, prosecco 60 | Orange wheel | [Difford's](https://www.diffordsguide.com/cocktails/recipe/2515/negroni-sbagliato) | None | The Negroni with sparkling wine in place of gin. **Difford's credits it to a bartender at Bar Basso in Milan; long established as a standard** |
| 4 | Milano-Torino `milano-torino` | aperitif · stir · rocks · large-cube | Campari 45, sweet vermouth 45 | Orange slice | [Difford's](https://www.diffordsguide.com/cocktails/recipe/3495/milano-torino-mi-to) | None | The 1860s drink that the Americano and the Negroni come from |
| 5 | Adonis `adonis` | wine · stir · coupe · none | Palo cortado sherry 30, amontillado sherry 30, sweet vermouth 30, red bitter 2.5 | An olive; orange zest expressed and discarded | [Difford's](https://www.diffordsguide.com/cocktails/recipe/18/adonis) | `palo-cortado-sherry`, `amontillado-sherry` | An 1880s sherry and vermouth aperitif; the only one here without Campari as its main note |
| A1 | Cardinale `cardinale` | gin · stir · cocktail · none | Gin 40, dry vermouth 20, Campari 10 | Lemon zest | [IBA](https://iba-world.com/iba-cocktail/cardinale/) | None | A dry Negroni relative from Rome |
| A2 | Pichuncho `pichuncho` **(Chilean)** | pisco · stir · rocks · cubes | Pisco 60, sweet vermouth 20, bianco vermouth 20, sugar syrup (2:1) 2.5 | Orange zest | [Difford's](https://www.diffordsguide.com/cocktails/recipe/1519/pichuncho-cocktail); [La Tercera](https://www.latercera.com/practico/noticia/5-tragos-chilenos-y-como-prepararlos/EWUJHQ6CTBFPLGXZUZSZCOFAGM/) gives pisco 135 and red vermouth 45 with a lemon slice | `bianco-vermouth` in the Difford's version only | Chile's pisco and vermouth. **The two sources disagree; Difford's says its recipe is "based on" the traditional one** |

The IBA's Kir is left out because the Kir Royal is proposed in Sparkling & spritz.

### Hot drinks (5)

| # | Recipe | Base · technique · glass · ice | Spec | Garnish | Source | Missing | Why |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Café irlandés / Irish Coffee `irish-coffee` | whisky · build · mug · none | Irish whiskey 50, hot coffee 120, sugar 1 barspoon, chilled cream 50 floated on top | None | [IBA](https://iba-world.com/iba-cocktail/irish-coffee/) | `irish-whiskey`, `coffee`, `cream` | The best-known hot cocktail, with a floated layer |
| 2 | Hot Toddy `hot-toddy` | whisky · build · mug · none | Scotch 45, lemon juice 7.5, honey syrup 7.5, sugar syrup (2:1) 5, cloves 3, boiling water 60 | Lemon slice and a cinnamon stick | [Difford's](https://www.diffordsguide.com/cocktails/recipe/987/hot-toddy-hot-scotch-and-lemon) | `scotch-whisky`, `honey-syrup`, `cloves` | The basic hot drink: spirit, sweetener, lemon and hot water |
| 3 | Hot Buttered Rum `hot-buttered-rum` | rum · build · mug · none | Aged rum 60, honey 2 barspoons, butter 1 knob, nutmeg 2 pinches, boiling water to top up | Cinnamon stick and a lemon slice studded with cloves | [Difford's](https://www.diffordsguide.com/cocktails/recipe/981/hot-buttered-rum-cocktail) | `aged-rum`, `honey`, `butter`, `nutmeg` | The colonial American winter drink |
| 4 | Navegado `navegado` **(Chilean)** | wine · heat · mug · none | Red wine 150, sugar 40 g, orange 2 slices, cinnamon and cloves | None | [La Tercera](https://www.latercera.com/paula/salud-los-navegados-del-mundo/): a batch of 1 bottle of red wine, 1 cup of sugar, 2 cinnamon sticks, 2 cloves and 2 oranges, heated in a pot | `red-wine`, `orange`, `cinnamon-stick`, `cloves` | Chile's mulled wine and the only candidate made in the pot (`heat`). **The per-mug amounts are my conversion of a batch recipe** |
| 5 | Negus `negus` | wine · build · mug · none | Ruby port 50, lemon juice 10, sugar syrup (2:1) 7.5, boiling water 105 | Grated nutmeg | [Difford's](https://www.diffordsguide.com/cocktails/recipe/1393/negus-hot) | `nutmeg` | An 18th-century hot port drink; light, and built from the port already in the catalogue |
| A1 | Vino caliente / Mulled Wine `mulled-wine` | wine · build · mug · none | Tawny port 45, red wine 45, lemon juice 15, honey 2 barspoons, orange liqueur 15, cloves 5, nutmeg and cinnamon a pinch each, an orange wedge, boiling water to top up | Cinnamon stick | [Difford's](https://www.diffordsguide.com/cocktails/recipe/1379/mulled-wine) | `red-wine`, `honey`, `grand-marnier`, `cloves`, `nutmeg`, `cinnamon`, `orange` | The European mulled wine. **It replaces the Navegado; the two should not both be in** |
| A2 | Blue Blazer `blue-blazer` | whisky · throw · mug · none | For two: Scotch 120, boiling water 120, powdered sugar 1 barspoon each | Lemon zest | [Difford's](https://www.diffordsguide.com/cocktails/recipe/256/blue-blazer) | `scotch-whisky` | Jerry Thomas's flaming drink, and a use for `throw`. **The whisky is lit and thrown while burning: a safety decision. The spec makes two** |

All but the Navegado are made in the mug with boiling water, so they are `build`, not `heat`.

### Beer (5)

| # | Recipe | Base · technique · glass · ice | Spec | Garnish | Source | Missing | Why |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Michelada `michelada` | beer · build · pint · cubes | Lime juice 12.5, hot pepper sauce 2 dashes, Worcestershire sauce 5, dark lager 150 | Salt rim and a lime wedge | [Difford's](https://www.diffordsguide.com/cocktails/recipe/1313/michelada) | `dark-lager`, `hot-sauce`, `worcestershire-sauce` | Mexico's seasoned beer, the best-known beer cocktail in Latin America |
| 2 | Shandy `shandy` | beer · build · pint · none | Lager to two thirds of the glass, ginger ale to top up | None | [Difford's](https://www.diffordsguide.com/cocktails/recipe/2576/shandygaff), as the Shandygaff | `lager`, `ginger-ale` | Beer lengthened with a soft drink. The source notes that lemonade is now the usual mixer |
| 3 | Black Velvet `black-velvet` | beer · build · flute · none | Stout 75, brut sparkling wine 75 | None | [Difford's](https://www.diffordsguide.com/cocktails/recipe/237/black-velvet) | `stout` | Stout and Champagne, said to date from 1861 |
| 4 | Black and Tan `black-and-tan` | beer · build · pint · none | Pale ale half a pint, then stout half a pint floated on top | None | [Difford's](https://www.diffordsguide.com/cocktails/recipe/222/black-and-tan) | `pale-ale`, `stout` | Two beers in two layers; a use for `layered` and `pint` |
| 5 | Fan-Schop `fan-schop` **(Chilean)** | beer · build · pint · none | Lager and orange soda in equal parts | None | [Pilar's Chilean Food & Garden](https://www.chileanfoodandgarden.com/fanshop-chilean-drink/), seen only in a search result; the page could not be read | `lager`, `orange-soda` | Chile's beer and orange soda. **Needs a source you accept; no source gives amounts** |
| A1 | Snakebite `snakebite` | beer · build · pint · none | Lager to half the glass, medium-dry cider to top up | None | [Difford's](https://www.diffordsguide.com/cocktails/recipe/1836/snakebite) | `lager`, `cider` | The British lager and cider mix |
| A2 | Boilermaker `boilermaker` | beer · build · pint · none | Bourbon 30, lager 1 pint | None | [Difford's](https://www.diffordsguide.com/cocktails/recipe/282/boilermaker) | `lager` | A whiskey and a beer. **Two glasses in practice (a shot and a pint); the schema has one glass per recipe** |

Difford's serves the Michelada and the Snakebite in a Collins glass; `pint` is my mapping for the beer family.

Malta con huevo was considered as a second Chilean drink and left out: no published recipe with amounts was found.

### Mocktails (5)

All have base `none`. Each is a drink known by its own name, not an alcohol-free version made for this list.

| # | Recipe | Base · technique · glass · ice | Spec | Garnish | Source | Missing | Why |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Shirley Temple `shirley-temple` | none · build · collins · cubes | Grenadine 7.5, lemon juice 10, ginger ale 165 | Lemon wheel and a maraschino cherry | [Difford's](https://www.diffordsguide.com/cocktails/recipe/1817/shirley-temple-mocktail) | `ginger-ale` | The best-known alcohol-free mixed drink |
| 2 | Arnold Palmer `arnold-palmer` | none · shake · collins · cubes | Cold black tea 60, lemon juice 37.5, sugar syrup (2:1) 30, soda water 30 | Lemon wheel | [Difford's](https://www.diffordsguide.com/cocktails/recipe/2142/arnold-palmer) | `black-tea` | Iced tea and lemonade |
| 3 | Virgin Mary `virgin-mary` | none · throw · collins · cubes | Tomato juice 150, lemon juice 15, hot pepper sauce 8 drops, Worcestershire sauce 4 dashes, horseradish sauce half a barspoon, celery salt 2 pinches, black pepper 2 grinds | Celery stick | [Difford's](https://www.diffordsguide.com/cocktails/recipe/252/bloody-shame-non-alcoholic) | `tomato-juice`, `hot-sauce`, `worcestershire-sauce`, `horseradish`, `celery-salt`, `black-pepper` | The savoury one of the list. **An alcohol-free Bloody Mary, though long known by its own name. The source rolls it between tins, which is `throw`** |
| 4 | Saint Clements `saint-clements` | none · build · collins · cubes | Orange juice 90, bitter lemon 90 | A citrus wedge or slice | [Difford's](https://www.diffordsguide.com/cocktails/recipe/1727/saint-clements) | `bitter-lemon` | The British pub standard, two ingredients |
| 5 | Pussyfoot `pussyfoot` | none · shake · collins · cubes | Orange juice 120, lemon juice 15, lime juice 15, grenadine 15, egg yolk 1, mint leaves 7 | Orange slice | [Difford's](https://www.diffordsguide.com/cocktails/recipe/1620/pussyfoot-alcohol-free) | None | A 1920 alcohol-free cocktail in the shaken style, with an egg yolk |
| A1 | Roy Rogers `roy-rogers` | none · build · collins · cubes | Grenadine 7.5, cola to top up | Lime wedge | [Difford's](https://www.diffordsguide.com/cocktails/recipe/1700/roy-rogers-non-alcoholic) | None | The cola twin of the Shirley Temple, which is why it is an alternate |
| A2 | Mote con huesillo `mote-con-huesillo` **(Chilean)** | none · heat · collins · none | Per glass: cooked mote 3 tablespoons, dried peaches 2, their cooking syrup to fill | None | No source read page by page. The recipes seen in search results are batches that disagree, for example 12 dried peaches, 1 litre of water, 3 cups of cooked mote and 1 cup of sugar for 6 | `mote`, `huesillos`, `cinnamon-stick` | Chile's traditional summer drink. **Cooked for hours and eaten with a spoon: a dessert as much as a drink, and hard to cost by the glass** |

### Read and left out

- **Bramble** (IBA): crushed ice but no mint or herb, so it fits neither Sours nor Juleps & smashes cleanly.
- **Tom and Jerry** (Difford's): a batter for six, which the recipe format cannot hold.
- **Kir** (IBA): one Kir is enough; the Kir Royal is the proposed one.

## Open questions

1. **Chilean source.** Which published source do you accept for Chilean drinks? The La Tercera article above covers the Terremoto, Pichuncho, Borgoña and Ponche a la romana. Pilar Hernández's site covers the Cola de mono, Navegado and Fan-Schop, but I could not read it. The four Chilean recipes in `data/` have no `sources` either.
2. **Base for drinks with no spirit.** The Grasshopper, B-52 and Carajillo are made of liqueurs only, and no value of `base` fits. Add a `liqueur` base, or file them under another? I used `aperitif` for the Fernandito.
3. **Modern drinks the IBA lists.** Old Cuban, Russian Spring Punch, Espresso Martini and Gin Basil Smash are credited to known bartenders, and the IBA lists them. The brief counts IBA drinks as classics; confirm that these are in. The Hugo (2005), the Negroni Sbagliato and the B-52 have named creators and are not IBA-listed.
4. **Rich syrup.** Difford's specs use a 2:1 syrup, and the catalogue's `sugar-syrup` is a simple syrup. Add `rich-sugar-syrup`, or convert the amounts?
5. **Amounts that are not ml.** The IBA writes "a few drops" of egg white (Clover Club, New York Sour). The beer drinks are given in parts of a glass. Batch drinks (Navegado, Cola de mono, Borgoña, Ponche a la romana, Mote con huesillo) need a per-serving conversion. Who sets these numbers, and does the recipe say they are converted?
6. **Overlaps.** Aperitivo would hold four Campari and vermouth drinks, next to the Negroni and, if approved, the Boulevardier. The Navegado and the Mulled Wine are the same idea. Tell me where to thin.
7. **Glasses the schema lacks.** Hurricane (Singapore Sling), goblet (Peruvian pisco sour) and a toddy or Irish coffee glass. I mapped them to `collins`, `coupe` and `mug`.
8. **Part 1 decisions.** The Whiskey Sour's serve, the Mai Tai's ice, the Planter's Punch spec, the size and citrus of the Chilean pisco sour, and the Terremoto's glass size and fernet.
