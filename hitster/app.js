/* ============================================================
   Hitster — Web Edition
   Pure front-end. Spotify Authorization Code + PKCE (no backend,
   no client secret) + Web Playback SDK (requires Premium).
   ============================================================ */

"use strict";

// Prefilled Spotify Client ID so allowlisted players can just click Connect
// without pasting anything. Safe to embed: with PKCE the Client ID is a public
// value, not a secret. Leave "" to require each user to paste their own.
const DEFAULT_CLIENT_ID = "48565e208019414aa7c8ca9cc046d24d";

// Prefilled (but still editable) playlist. Paste a Spotify playlist link/URI
// here to set the game's default deck.
const DEFAULT_PLAYLIST = "https://open.spotify.com/playlist/4usB6m0N9NsfWzwdk9Jj0d";

// Built-in deck: well-known songs across the decades. Each is resolved to a
// playable Spotify track at game time via the Search API (no playlist needed).
const BUILTIN_DECK = [
  { title: "Rigoletto: \"La Donna E' Mobile\"", artist: "Enrico Caruso", year: 1908, uri: "spotify:track:7idTMG6EKZy0531lIx8RJ5" },
  { title: "Auld Lang Syne", artist: "Frank C. Stanley", year: 1910, uri: "spotify:track:7GIxdonjm1JVjdxiTxL6Ja" },
  { title: "In the Mood", artist: "Glenn Miller", year: 1939, uri: "spotify:track:0wAyDBh0ujohCsYeXBtDLF" },
  { title: "That's Amore", artist: "Dean Martin", year: 1953, uri: "spotify:track:6GYqOflskcZxPj8rkTZkOy" },
  { title: "(We're Gonna) Rock Around The Clock", artist: "Bill Haley & His Comets", year: 1955, uri: "spotify:track:1uRKT2LRANv4baowBWHfDS" },
  { title: "See You Later, Alligator", artist: "Bill Haley & His Comets", year: 1956, uri: "spotify:track:1s4hyUFWmLWiAamsclb4xA" },
  { title: "Be-Bop-A-Lula", artist: "Gene Vincent & His Blue Caps, Gene Vincent", year: 1956, uri: "spotify:track:0TMrV95mP7sDlvbE4iVfKP" },
  { title: "I've Got a Woman", artist: "Ray Charles", year: 1957, uri: "spotify:track:2xar08Fq5xra2KKZs5Bw9j" },
  { title: "Everyday", artist: "Buddy Holly, The Crickets", year: 1958, uri: "spotify:track:39lnzOIUCSNaQmgBHoz7rt" },
  { title: "Jailhouse Rock", artist: "Elvis Presley", year: 1958, uri: "spotify:track:4gphxUgq0JSFv2BCLhNDiE" },
  { title: "Tequila", artist: "The Champs", year: 1958, uri: "spotify:track:17qIyxyDWmNP7Rn11eprMt" },
  { title: "Good Golly Miss Molly", artist: "Little Richard", year: 1958, uri: "spotify:track:32fZXsDwoDchpdtsCmeo0o" },
  { title: "Lollipop", artist: "The Chordettes", year: 1958, uri: "spotify:track:3sPJq1OLj384en6GqBBpcx" },
  { title: "Johnny B. Goode", artist: "Chuck Berry", year: 1959, uri: "spotify:track:2QfiRTz5Yc8DdShCxG1tB2" },
  { title: "Ain't That A Shame", artist: "Fats Domino", year: 1959, uri: "spotify:track:4ZfQwNx3FlCN07cnUvekh3" },
  { title: "La Bamba", artist: "Ritchie Valens", year: 1959, uri: "spotify:track:2aEeghgUcnu75tzcolFMfs" },
  { title: "Dream Lover", artist: "Bobby Darin", year: 1959, uri: "spotify:track:1KLpjQFgubHI3GkAICCNH3" },
  { title: "Summertime Blues", artist: "Eddie Cochran", year: 1960, uri: "spotify:track:3oAWTk92mZBxKBOKf8mR5v" },
  { title: "The Twist", artist: "Chubby Checker", year: 1960, uri: "spotify:track:5GVhFvXo4Q3LfM1gZi46F5" },
  { title: "(What A) Wonderful World", artist: "Sam Cooke", year: 1960, uri: "spotify:track:2G0GextMwZJLkNxcSZ7ZJ3" },
  { title: "The Wanderer", artist: "Dion", year: 1961, uri: "spotify:track:48IweEL7NqHvCe81qoXu2E" },
  { title: "Oh, Pretty Woman", artist: "Roy Orbison", year: 1962, uri: "spotify:track:48i055G1OT5KxGGftwFxWy" },
  { title: "The Locomotion", artist: "Little Eva", year: 1962, uri: "spotify:track:5xzdDMhFYiuUONB0Mha9VS" },
  { title: "Ring of Fire", artist: "Johnny Cash", year: 1963, uri: "spotify:track:6YffUZJ2R06kyxyK6onezL" },
  { title: "Surfin' U.S.A.", artist: "The Beach Boys", year: 1963, uri: "spotify:track:2dbaIpJoAk2hhrrX2ljKJo" },
  { title: "Surfin' Bird", artist: "The Trashmen", year: 1963, uri: "spotify:track:4kOO2ADjyM5oJxcUiPsG15" },
  { title: "Do Wah Diddy Diddy", artist: "Manfred Mann", year: 1964, uri: "spotify:track:7gEpTMp9MQc1uJwivtL37R" },
  { title: "The Shoop Shoop Song (It's in His Kiss)", artist: "Betty Everett", year: 1964, uri: "spotify:track:5U9KYnq3WWeYFhStKk7Lhr" },
  { title: "I Got You Babe", artist: "Sonny & Cher", year: 1965, uri: "spotify:track:4SGBuq37Ol4HJr7pQqFMKa" },
  { title: "Tainted Love", artist: "Gloria Jones", year: 1965, uri: "spotify:track:0BbA7S30mOQB94e4IBnqCt" },
  { title: "I Can't Help Myself (Sugar Pie, Honey Bunch)", artist: "Four Tops", year: 1965, uri: "spotify:track:6b6IMqP565TbtFFZg9iFf3" },
  { title: "Feeling Good", artist: "Nina Simone", year: 1965, uri: "spotify:track:6Rqn2GFlmvmV4w9Ala0I1e" },
  { title: "Guajira Guantanamera", artist: "Joseito Fernández", year: 1966, uri: "spotify:track:0KMGf0ebdR8aazf1PoHEdb" },
  { title: "Rescue Me", artist: "Fontella Bass", year: 1966, uri: "spotify:track:1GY8zOFi8rC39xXnD0tKO8" },
  { title: "I Got You (I Feel Good)", artist: "James Brown & The Famous Flames", year: 1966, uri: "spotify:track:5haXbSJqjjM0TCJ5XkfEaC" },
  { title: "When a Man Loves a Woman", artist: "Percy Sledge", year: 1966, uri: "spotify:track:2mTiKaGdMPA4wfOGGUroE5" },
  { title: "You Can't Hurry Love", artist: "The Supremes", year: 1966, uri: "spotify:track:4H1iMlEWKZmpKTHCZzDhju" },
  { title: "These Boots Are Made For Walkin'", artist: "Nancy Sinatra", year: 1966, uri: "spotify:track:2nwCO1PqpvyoFIvq3Vrj8N" },
  { title: "I'm a Believer", artist: "The Monkees", year: 1967, uri: "spotify:track:3G7tRC24Uh09Hmp1KZ7LQ2" },
  { title: "San Francisco (Be Sure to Wear Flowers in Your Hair)", artist: "Scott McKenzie", year: 1967, uri: "spotify:track:6vcNJUWtUPB0hKC6VbZriY" },
  { title: "The Letter", artist: "The Box Tops", year: 1967, uri: "spotify:track:6RJK553YhstRzyKA4mug09" },
  { title: "Knock on Wood", artist: "Eddie Floyd", year: 1967, uri: "spotify:track:3YJx77Xx8JSwEoxqrkQO5c" },
  { title: "Piece of My Heart", artist: "Erma Franklin", year: 1967, uri: "spotify:track:2GbePPrWWSRxcmW6QRSPae" },
  { title: "Pata Pata", artist: "Miriam Makeba", year: 1967, uri: "spotify:track:7d3cKDG22Ig9kZOS1qsq3S" },
  { title: "Happy Together", artist: "The Turtles", year: 1967, uri: "spotify:track:1JO1xLtVc8mWhIoE3YaCL0" },
  { title: "Respect", artist: "Aretha Franklin", year: 1967, uri: "spotify:track:7s25THrKz86DM225dOYwnr" },
  { title: "I Heard It Through The Grapevine", artist: "Marvin Gaye", year: 1968, uri: "spotify:track:1tqT6DhmsrtQgyCKUwotiw" },
  { title: "Born To Be Wild", artist: "Steppenwolf", year: 1968, uri: "spotify:track:63OFKbMaZSDZ4wtesuuq6f" },
  { title: "Girl, You'll Be A Woman Soon", artist: "Neil Diamond", year: 1968, uri: "spotify:track:1BmVQ5RGqqtF5cnsv6cQYu" },
  { title: "Build Me Up Buttercup", artist: "The Foundations", year: 1968, uri: "spotify:track:6sPOmDulFtLzfX25zICNrC" },
  { title: "Make Your Own Kind Of Music", artist: "Cass Elliot", year: 1969, uri: "spotify:track:6H3Wa6hWR9DRMzMSd4pZkT" },
  { title: "With A Little Help From My Friends", artist: "Joe Cocker", year: 1969, uri: "spotify:track:0YZ3J8xzGwLOg4yEgST1YK" },
  { title: "Pop Corn", artist: "Gershon Kingsley", year: 1969, uri: "spotify:track:6vR3EeRjcUf7ad98I4Euds" },
  { title: "Come Together", artist: "The Beatles", year: 1969, uri: "spotify:track:2EqlS6tkEnglzr7tkKAAYD" },
  { title: "Sugar Sugar", artist: "The Archies", year: 1969, uri: "spotify:track:6MTd61g9zq6CB1FnJydjEb" },
  { title: "Big Yellow Taxi", artist: "Joni Mitchell", year: 1970, uri: "spotify:track:6UkMcAA19lTdjs22jtB7o2" },
  { title: "Signed, Sealed, Delivered (I'm Yours)", artist: "Stevie Wonder", year: 1970, uri: "spotify:track:2eF8pWbiivYsYRpbntYsnc" },
  { title: "You Can Get It If You Really Want", artist: "Jimmy Cliff", year: 1970, uri: "spotify:track:6IwTuQuQ4suJTQ43plwZef" },
  { title: "Up Around The Bend", artist: "Creedence Clearwater Revival", year: 1970, uri: "spotify:track:36gPq8WG7tDxrblyGVUCiT" },
  { title: "Move on Up", artist: "Curtis Mayfield", year: 1970, uri: "spotify:track:0MHXrqn909p0LRTPsNsGEi" },
  { title: "Your Song", artist: "Elton John", year: 1970, uri: "spotify:track:38zsOOcu31XbbYj9BIPUF1" },
  { title: "In the Summertime", artist: "Mungo Jerry", year: 1971, uri: "spotify:track:7jhKkbM3KZvnuqzMX5fADH" },
  { title: "Life on Mars?", artist: "David Bowie", year: 1971, uri: "spotify:track:3ZE3wv8V3w2T2f7nOCjV0N" },
  { title: "I Can See Clearly Now", artist: "Johnny Nash", year: 1972, uri: "spotify:track:0DcrhZ12WcCqruCs8ibXSf" },
  { title: "You're So Vain", artist: "Carly Simon", year: 1972, uri: "spotify:track:2DnJjbjNTV9Nd5NOa1KGba" },
  { title: "Live And Let Die", artist: "Wings", year: 1973, uri: "spotify:track:6AbaUu4XtHu7pGkPE94Tat" },
  { title: "Sweet Home Alabama", artist: "Lynyrd Skynyrd", year: 1974, uri: "spotify:track:7e89621JPkKaeDSTQ3avtg" },
  { title: "Jolene", artist: "Dolly Parton", year: 1974, uri: "spotify:track:2SpEHTbUuebeLkgs9QB7Ue" },
  { title: "She - Tous les visages de l’amour", artist: "Charles Aznavour, Richard Galliano, Eddie Louiss", year: 1974, uri: "spotify:track:2OxkfL5jW8bvYTCNDLlRSY" },
  { title: "You're The First, The Last, My Everything", artist: "Barry White", year: 1974, uri: "spotify:track:5dXJ1SoksFkgdx3yxIoYNO" },
  { title: "The Hustle", artist: "Van McCoy", year: 1975, uri: "spotify:track:0UJGfazIInn3xV7FfUipPq" },
  { title: "December, 1963 (Oh What a Night!)", artist: "The Four Seasons", year: 1975, uri: "spotify:track:1hQFF33xi8ruavZNyovtUN" },
  { title: "I Love Rock N Roll", artist: "The Arrows", year: 1975, uri: "spotify:track:4zGBAwjlJ0TP02mHH8Wpmo" },
  { title: "Don't Leave Me This Way", artist: "Thelma Houston", year: 1976, uri: "spotify:track:51qi5dgc9CsotM87GmRkAX" },
  { title: "More Than a Feeling", artist: "Boston", year: 1976, uri: "spotify:track:1QEEqeFIZktqIpPI4jSVSF" },
  { title: "You Make Me Feel Like Dancing", artist: "Leo Sayer", year: 1976, uri: "spotify:track:3DZ11M7LSpVQzYHnFx3i95" },
  { title: "Love Really Hurts Without You", artist: "Billy Ocean", year: 1976, uri: "spotify:track:4GhtDORJiSRYxj6M1bv0vX" },
  { title: "If You Leave Me Now", artist: "Chicago", year: 1976, uri: "spotify:track:0KMGxYKeUzK9wc5DZCt3HT" },
  { title: "Let's Stick Together", artist: "Bryan Ferry", year: 1976, uri: "spotify:track:6y4FVJwf09ssxuRnlEgXkp" },
  { title: "Disco Inferno", artist: "The Trammps", year: 1976, uri: "spotify:track:5jUA1njy3h6ynHLvPdEVHt" },
  { title: "Easy", artist: "Commodores", year: 1977, uri: "spotify:track:1JQ6Xm1JrvHfvAqhl5pwaA" },
  { title: "Ca plane pour moi", artist: "Plastic Bertrand", year: 1978, uri: "spotify:track:71yCMlsD6qbD7NmNUEoVNR" },
  { title: "It's a Heartache", artist: "Bonnie Tyler", year: 1978, uri: "spotify:track:2pag2vElkdroT8hIO4Gozi" },
  { title: "Because the Night", artist: "Patti Smith", year: 1978, uri: "spotify:track:77XlfkvXtMwppbEU5sku97" },
  { title: "You Make Me Feel (Mighty Real)", artist: "Sylvester", year: 1978, uri: "spotify:track:3j1fs2X0ibiihnM4Fd4A2D" },
  { title: "Le Freak", artist: "CHIC", year: 1978, uri: "spotify:track:7Kszjzps0xbQXyo1pO4KfE" },
  { title: "Gimme! Gimme! Gimme! (A Man After Midnight)", artist: "ABBA", year: 1979, uri: "spotify:track:3vkQ5DAB1qQMYO4Mr9zJN6" },
  { title: "We Are Family", artist: "Sister Sledge", year: 1979, uri: "spotify:track:5IKLwqBQG6KU6MP2zP80Nu" },
  { title: "Born to Be Alive", artist: "Patrick Hernandez", year: 1979, uri: "spotify:track:5WI7WETcabzR2k2euhcpo7" },
  { title: "Escape (The Pina Colada Song)", artist: "Rupert Holmes", year: 1979, uri: "spotify:track:5IMtdHjJ1OtkxbGe4zfUxQ" },
  { title: "Cruel to Be Kind", artist: "Nick Lowe", year: 1979, uri: "spotify:track:7D5ycpIrqwGNTQFKmzhDIg" },
  { title: "Upside Down", artist: "Diana Ross", year: 1980, uri: "spotify:track:57Y3UccJEJqT8w8RWkUAz0" },
  { title: "You Make My Dreams (Come True)", artist: "Daryl Hall & John Oates", year: 1980, uri: "spotify:track:4o6BgsqLIBViaGVbx5rbRk" },
  { title: "Celebration", artist: "Kool & The Gang", year: 1980, uri: "spotify:track:3K7Q9PHUWPTaknlbFPThn2" },
  { title: "Bette Davis Eyes", artist: "Kim Carnes", year: 1981, uri: "spotify:track:0odIT9B9BvOCnXfS0e4lB5" },
  { title: "Don't Stop Believin'", artist: "Journey", year: 1981, uri: "spotify:track:4bHsxqR3GMrXTxEPLuK5ue" },
  { title: "Start Me Up", artist: "The Rolling Stones", year: 1981, uri: "spotify:track:7HKez549fwJQDzx3zLjHKC" },
  { title: "Don't You Want Me", artist: "The Human League", year: 1981, uri: "spotify:track:3L7RtEcu1Hw3OXrpnthngx" },
  { title: "Super Freak", artist: "Rick James", year: 1981, uri: "spotify:track:5vFFwU909VMZIBA7sZPtW0" },
  { title: "Africa", artist: "TOTO", year: 1982, uri: "spotify:track:2374M0fQpWi3dLnB54qaLX" },
  { title: "Only You", artist: "Yazoo", year: 1982, uri: "spotify:track:15Mh8m2BGTUptR8yy7fNAS" },
  { title: "Under Pressure", artist: "Queen, David Bowie", year: 1982, uri: "spotify:track:2fuCquhmrzHpu5xcA1ci9x" },
  { title: "White Wedding - Pt. 1", artist: "Billy Idol", year: 1982, uri: "spotify:track:1gzIbdFnGJ226LTl0Cn2SX" },
  { title: "Gloria", artist: "Laura Branigan", year: 1982, uri: "spotify:track:1mskmld5ZKEhRaNvYVPoqZ" },
  { title: "Flashdance...What a Feeling", artist: "Irene Cara", year: 1983, uri: "spotify:track:3cbV252akVZInSvJk7jAYX" },
  { title: "Sweet Dreams (Are Made of This)", artist: "Eurythmics, Annie Lennox, Dave Stewart", year: 1983, uri: "spotify:track:1TfqLAPs4K3s2rJMoCokcS" },
  { title: "Karma Chameleon", artist: "Culture Club", year: 1983, uri: "spotify:track:3XDeeP9wBZzGhIPZmLfEEx" },
  { title: "Give It Up", artist: "KC & The Sunshine Band", year: 1983, uri: "spotify:track:3yDhZq8f17SmumVmEyCaRN" },
  { title: "Every Breath You Take", artist: "The Police", year: 1983, uri: "spotify:track:1JSTJqkT5qHq8MDJnJbRE1" },
  { title: "Ain't Nobody", artist: "Rufus, Chaka Khan", year: 1983, uri: "spotify:track:53Za5vyGc1x7GxgJVRjRKc" },
  { title: "Jump (For My Love)", artist: "The Pointer Sisters", year: 1983, uri: "spotify:track:1kdxZYbXrqBX2hWtw3VFQF" },
  { title: "Purple Rain", artist: "Prince", year: 1984, uri: "spotify:track:54X78diSLoUDI3joC2bjMz" },
  { title: "Never Ending Story", artist: "Limahl", year: 1984, uri: "spotify:track:1F43XlPBiwAUUIhrUGzylO" },
  { title: "Heaven", artist: "Bryan Adams", year: 1984, uri: "spotify:track:7Ewz6bJ97vUqk5HdkvguFQ" },
  { title: "Forever Young", artist: "Alphaville", year: 1984, uri: "spotify:track:4S1VYqwfkLit9mKVY3MXoo" },
  { title: "Dancing In the Dark", artist: "Bruce Springsteen", year: 1984, uri: "spotify:track:7FwBtcecmlpc1sLySPXeGE" },
  { title: "Smalltown Boy", artist: "Bronski Beat", year: 1984, uri: "spotify:track:5vmRQ3zELMLUQPo2FLQ76x" },
  { title: "Walk Of Life", artist: "Dire Straits", year: 1985, uri: "spotify:track:3Ud6fFep5ZlXzRWw6Sm8no" },
  { title: "Your Love", artist: "The Outfield", year: 1985, uri: "spotify:track:4oDZ5L8izBals6jKBJDBcX" },
  { title: "Manic Monday", artist: "The Bangles", year: 1985, uri: "spotify:track:798fUF6UnRn27xiVuKyJCi" },
  { title: "Holding Back the Years", artist: "Simply Red", year: 1985, uri: "spotify:track:1yg7fwwYmx9DQ2TdXUmfpJ" },
  { title: "The Whole of the Moon", artist: "The Waterboys", year: 1985, uri: "spotify:track:15mZo1Kah03g8CTLbSsWrr" },
  { title: "Dancing On The Ceiling", artist: "Lionel Richie", year: 1986, uri: "spotify:track:0snPJPxkk0MbTc0xeUvAPt" },
  { title: "You Can Call Me Al", artist: "Paul Simon", year: 1986, uri: "spotify:track:0qxYx4F3vm1AOnfux6dDxP" },
  { title: "Brother Louie", artist: "Modern Talking", year: 1986, uri: "spotify:track:5zWZ9iNevP0397xB3jWV2z" },
  { title: "Higher Love", artist: "Steve Winwood", year: 1986, uri: "spotify:track:4ZExvJvQXPEeYzGU0N3THi" },
  { title: "Don't Dream It's Over", artist: "Crowded House", year: 1986, uri: "spotify:track:7G7tgVYORlDuVprcYHuFJh" },
  { title: "Got My Mind Set on You", artist: "George Harrison", year: 1987, uri: "spotify:track:3OeUlriM0EZHdWleJtjoVr" },
  { title: "Sweet Child O' Mine", artist: "Guns N' Roses", year: 1987, uri: "spotify:track:7o2CTH4ctstm8TNelqjb51" },
  { title: "I Wanna Dance with Somebody (Who Loves Me)", artist: "Whitney Houston", year: 1987, uri: "spotify:track:2tUBqZG2AbRi7Q0BIrVrEj" },
  { title: "Hungry Eyes", artist: "Eric Carmen", year: 1987, uri: "spotify:track:7eafuv44YprITfOdzfVLoU" },
  { title: "Sweetest Thing", artist: "U2", year: 1987, uri: "spotify:track:6C67KcwSOikGyrebYqgwjx" },
  { title: "Everywhere", artist: "Fleetwood Mac", year: 1987, uri: "spotify:track:4k5FeWIdUaBx5OZdvrSYP1" },
  { title: "A Little Respect", artist: "Erasure", year: 1988, uri: "spotify:track:7aS418hRnOnYrXeyrZilwk" },
  { title: "She Drives Me Crazy", artist: "Fine Young Cannibals", year: 1988, uri: "spotify:track:4d6eqRtpDX7tydHJGDZUBQ" },
  { title: "The Look", artist: "Roxette", year: 1988, uri: "spotify:track:2oWMI54r0qT4N8Xb4C76vq" },
  { title: "Baby Can I Hold You", artist: "Tracy Chapman", year: 1988, uri: "spotify:track:2DjWsDGgL1xNbhnr7f6t5F" },
  { title: "Waiting for a Star to Fall", artist: "Boy Meets Girl", year: 1988, uri: "spotify:track:09huOVRryZNV2deKFZLJDC" },
  { title: "Baby, I Love Your Way/Freebird", artist: "Will To Power", year: 1988, uri: "spotify:track:0kzSooCGpuphLwn8iTuO9h" },
  { title: "Buffalo Stance", artist: "Neneh Cherry", year: 1988, uri: "spotify:track:0FbbqjDqBNa78SL76JfCfX" },
  { title: "Dear Jessie", artist: "Madonna", year: 1989, uri: "spotify:track:1ZLgeJ8aUm1nJcddza8dVG" },
  { title: "Right Here Waiting", artist: "Richard Marx", year: 1989, uri: "spotify:track:4LFwNJWoj74Yd71fIr1W8x" },
  { title: "Volare (Nel Blu di Pinto di Blu)", artist: "Gipsy Kings", year: 1989, uri: "spotify:track:5QrHfu4q83HjcFcRi2WlS3" },
  { title: "We Didn't Start the Fire", artist: "Billy Joel", year: 1989, uri: "spotify:track:3Cx4yrFaX8CeHwBMReOWXI" },
  { title: "Lambada", artist: "Kaoma", year: 1989, uri: "spotify:track:32gpJnMZkRafZdQvU7ZzR7" },
  { title: "I Drove All Night", artist: "Cyndi Lauper", year: 1989, uri: "spotify:track:3J0AoQhAufniMrznCRJASD" },
  { title: "The Best", artist: "Tina Turner", year: 1989, uri: "spotify:track:6pPWRBubXOBAHnjl5ZIujB" },
  { title: "There She Goes", artist: "The La's", year: 1990, uri: "spotify:track:4c6vZqYHFur11FbWATIJ9P" },
  { title: "Nah Neh Nah", artist: "Vaya Con Dios", year: 1990, uri: "spotify:track:1fX0h6SaZBXwmr4haRvirQ" },
  { title: "Show Me Heaven", artist: "Maria McKee", year: 1990, uri: "spotify:track:1umFfZGw8bsBd1a0fLTQI3" },
  { title: "Nothing Compares 2 U", artist: "Sinéad O'Connor", year: 1990, uri: "spotify:track:5PQQrMn2UOeO7I4Twy5HoZ" },
  { title: "Ice Ice Baby", artist: "Vanilla Ice", year: 1990, uri: "spotify:track:11d9oUiwHuYt216EFA2tiz" },
  { title: "Under the Bridge", artist: "Red Hot Chili Peppers", year: 1991, uri: "spotify:track:3d9DChrdc6BOeFsbrZ3Is0" },
  { title: "Walking in Memphis", artist: "Marc Cohn", year: 1991, uri: "spotify:track:5fgkjhICZnqFctrV0AyuQD" },
  { title: "Alive", artist: "Pearl Jam", year: 1991, uri: "spotify:track:1L94M3KIu7QluZe63g64rv" },
  { title: "Come As You Are", artist: "Nirvana", year: 1991, uri: "spotify:track:2RsAajgo0g7bMCHxwH3Sk0" },
  { title: "Two Princes", artist: "Spin Doctors", year: 1991, uri: "spotify:track:4ePP9So5xRzspjLFVVbj90" },
  { title: "Friday I'm In Love", artist: "The Cure", year: 1992, uri: "spotify:track:4QlzkaRHtU8gAdwqjWmO8n" },
  { title: "Everybody Hurts", artist: "R.E.M.", year: 1992, uri: "spotify:track:6PypGyiu0Y2lCDBN1XZEnP" },
  { title: "Iron Lion Zion", artist: "Bob Marley & The Wailers", year: 1992, uri: "spotify:track:5iRPNyWioH9Km8gi58As4V" },
  { title: "Sing Hallelujah!", artist: "Dr. Alban", year: 1992, uri: "spotify:track:1ohbjkuczl6hEoYEo931PH" },
  { title: "'74-'75", artist: "The Connells", year: 1993, uri: "spotify:track:2MAVcVr2oylw2OZ3hojWYj" },
  { title: "Dreams", artist: "The Cranberries", year: 1993, uri: "spotify:track:4JGKZS7h4Qa16gOU3oNETV" },
  { title: "The Sign", artist: "Ace of Base", year: 1993, uri: "spotify:track:0hrBpAOgrt8RXigk83LLNE" },
  { title: "Informer", artist: "Snow", year: 1993, uri: "spotify:track:2LjiPAQOVazT8sRyXL3XRs" },
  { title: "Mr. Jones", artist: "Counting Crows", year: 1993, uri: "spotify:track:5DiXcVovI0FcY2s0icWWUu" },
  { title: "Mr. Vain", artist: "Culture Beat", year: 1993, uri: "spotify:track:2rTYgHxgcndkUrRoU7x0Sv" },
  { title: "I'd Do Anything For Love (But I Won't Do That)", artist: "Meat Loaf", year: 1993, uri: "spotify:track:4UrgDocbHywDZv2f3mBhCq" },
  { title: "The Rhythm of the Night", artist: "Corona", year: 1994, uri: "spotify:track:0ofMkI3jzmGCElAOgOLeo3" },
  { title: "Jump Around", artist: "House Of Pain", year: 1994, uri: "spotify:track:3TZwjdclvWt7iPJUnMpgcs" },
  { title: "Waterfalls", artist: "TLC", year: 1994, uri: "spotify:track:6qspW4YKycviDFjHBOaqUY" },
  { title: "Regulate", artist: "Warren G, Nate Dogg", year: 1994, uri: "spotify:track:7nYvUtkQMx1v80S2FH2s9J" },
  { title: "Basket Case", artist: "Green Day", year: 1994, uri: "spotify:track:6L89mwZXSOwYl76YXfX13s" },
  { title: "Self Esteem", artist: "The Offspring", year: 1994, uri: "spotify:track:1FkoVC85Ds3mFoK0fVqEqP" },
  { title: "Over My Shoulder", artist: "Mike + The Mechanics", year: 1995, uri: "spotify:track:0U9TKK9GYryei6Vn45TEdH" },
  { title: "Wonderwall", artist: "Oasis", year: 1995, uri: "spotify:track:3UNAMgNHKl0fWzbZaU0fDM" },
  { title: "No More \"I Love You's\"", artist: "Annie Lennox", year: 1995, uri: "spotify:track:2Pn5gvVioma5LHPxgEBBmD" },
  { title: "Hand in My Pocket", artist: "Alanis Morissette", year: 1995, uri: "spotify:track:2lE7oRoKssULAtbWViL385" },
  { title: "Ready or Not", artist: "Fugees, Ms. Lauryn Hill, Wyclef Jean, Pras", year: 1996, uri: "spotify:track:3vZO25GdYuqFrR1kzZADnp" },
  { title: "No Diggity", artist: "Blackstreet, Dr. Dre, Queen Pen", year: 1996, uri: "spotify:track:6MdqqkQ8sSC0WB4i8PyRuQ" },
  { title: "How Bizarre", artist: "OMC", year: 1996, uri: "spotify:track:46q5BtHso0ECuTKeq70ZhW" },
  { title: "Più bella cosa", artist: "Eros Ramazzotti", year: 1996, uri: "spotify:track:0KligwQn4Iy344p2Q5m6k6" },
  { title: "Return of the Mack", artist: "Mark Morrison", year: 1996, uri: "spotify:track:3jDdpx9PMlfMBS5tOBHFm9" },
  { title: "Lovefool", artist: "The Cardigans", year: 1996, uri: "spotify:track:0dTmbzrFyzE1KUGjVqGYfJ" },
  { title: "Dance into the Light", artist: "Phil Collins", year: 1996, uri: "spotify:track:0Gbz7QN5c8twO5YCZ9g1Kv" },
  { title: "Torn", artist: "Natalie Imbruglia", year: 1997, uri: "spotify:track:1Jaah2tmN9Hv81A87KZ1MU" },
  { title: "Together Again", artist: "Janet Jackson", year: 1997, uri: "spotify:track:1GrikfH0jDejDvrxo84n4P" },
  { title: "Save Tonight", artist: "Eagle-Eye Cherry", year: 1997, uri: "spotify:track:7v02Sn9vYRQ6pc1lqhnkWY" },
  { title: "Let Me Entertain You", artist: "Robbie Williams", year: 1997, uri: "spotify:track:0SLtqCrXBRrnkxSOMA3X4W" },
  { title: "Mysterious Girl", artist: "Peter Andre", year: 1997, uri: "spotify:track:3CiM7fBGbaP6jiyuH2Ot4j" },
  { title: "Bitter Sweet Symphony", artist: "The Verve", year: 1997, uri: "spotify:track:2i4AouhQeGFBb4g3cx8yqg" },
  { title: "Tubthumping", artist: "Chumbawamba", year: 1997, uri: "spotify:track:22HYEJveCvykVDHDiEEmjZ" },
  { title: "Fly Away", artist: "Lenny Kravitz", year: 1998, uri: "spotify:track:1OxcIUqVmVYxT6427tbhDW" },
  { title: "Ghetto Supastar (That is What You Are)", artist: "Pras, Ol' Dirty Bastard, Mýa", year: 1998, uri: "spotify:track:31bf9SEOppLU6lQ85d8om6" },
  { title: "Iris", artist: "The Goo Goo Dolls", year: 1998, uri: "spotify:track:6Qyc6fS4DsZjB2mRW9DsQs" },
  { title: "Everything Is Everything", artist: "Ms. Lauryn Hill", year: 1998, uri: "spotify:track:7t86fVeDAd63ThaR0ZkxXS" },
  { title: "Changes", artist: "2Pac, Talent", year: 1998, uri: "spotify:track:00i2HU7TEzzftShjRrDSEF" },
  { title: "Narcotic", artist: "Liquido", year: 1998, uri: "spotify:track:1H5VQuShs4qfwBXyHF0PeH" },
  { title: "You Get What You Give", artist: "New Radicals", year: 1998, uri: "spotify:track:1Cwsd5xI8CajJz795oy4XF" },
  { title: "Believe", artist: "Cher", year: 1998, uri: "spotify:track:2goLsvvODILDzeeiT4dAoR" },
  { title: "Praise You", artist: "Fatboy Slim", year: 1998, uri: "spotify:track:1XPcnAQncIro2b4sKDdDnX" },
  { title: "Closing Time", artist: "Semisonic", year: 1998, uri: "spotify:track:6liaHE9iHh23PLVvw7lK8V" },
  { title: "Teenage Dirtbag", artist: "Wheatus", year: 1999, uri: "spotify:track:25FTMokYEbEWHEdss5JLZS" },
  { title: "Learn to Fly", artist: "Foo Fighters", year: 1999, uri: "spotify:track:5OQsiBsky2k2kDKy2bX2eT" },
  { title: "She's so High", artist: "Tal Bachman", year: 1999, uri: "spotify:track:7mnGQesk1TzQLzQ9bYWZPR" },
  { title: "Still D.R.E.", artist: "Dr. Dre, Snoop Dogg", year: 1999, uri: "spotify:track:3UOuBNEin5peSRqdzvlnWM" },
  { title: "I Try", artist: "Macy Gray", year: 1999, uri: "spotify:track:5TAf4lnZCZTLlZHNZMLFLi" },
  { title: "Life Is A Rollercoaster", artist: "Ronan Keating", year: 2000, uri: "spotify:track:1vlTMKVV0FxG6CxGTmSY3t" },
  { title: "Oops!...I Did It Again", artist: "Britney Spears", year: 2000, uri: "spotify:track:6naxalmIoLFWR0siv8dnQQ" },
  { title: "One More Time", artist: "Daft Punk", year: 2000, uri: "spotify:track:2Uy6EhQXAYkXA6MohPgjpV" },
  { title: "Lady - Hear Me Tonight", artist: "Modjo", year: 2000, uri: "spotify:track:49X0LAl6faAusYq02PRAY6" },
  { title: "Only Time", artist: "Enya", year: 2000, uri: "spotify:track:6FLwmdmW77N1Pxb1aWsZmO" },
  { title: "Dancing in the Moonlight", artist: "Toploader", year: 2000, uri: "spotify:track:3Fzlg5r1IjhLk2qRw667od" },
  { title: "Follow Me", artist: "Uncle Kracker", year: 2000, uri: "spotify:track:4KoecuyOpZaNFZ0UqVsllc" },
  { title: "911", artist: "Wyclef Jean, Mary J. Blige", year: 2000, uri: "spotify:track:0kuLj2Y2tq3ygMfnv0LDe3" },
  { title: "How You Remind Me", artist: "Nickelback", year: 2001, uri: "spotify:track:0gmbgwZ8iqyMPmXefof8Yf" },
  { title: "Family Affair", artist: "Mary J. Blige", year: 2001, uri: "spotify:track:3aw9iWUQ3VrPQltgwvN9Xu" },
  { title: "Escape", artist: "Enrique Iglesias", year: 2001, uri: "spotify:track:4anDsZBavxjw3Ktw6ICGYd" },
  { title: "Me Gustas Tu", artist: "Manu Chao", year: 2001, uri: "spotify:track:6b37xrsNCWYIUphFBazqD6" },
  { title: "Dilemma", artist: "Nelly, Kelly Rowland", year: 2002, uri: "spotify:track:0ARK753YaiJbpLUk7z5yIM" },
  { title: "Sing For The Moment", artist: "Eminem", year: 2002, uri: "spotify:track:3CpoeW0cZSDzIRv5z34F87" },
  { title: "Murder On The Dancefloor", artist: "Sophie Ellis-Bextor", year: 2002, uri: "spotify:track:2Za2mUwmQoSxWPscaY2vxl" },
  { title: "A Thousand Miles", artist: "Vanessa Carlton", year: 2002, uri: "spotify:track:6t6rudGjkLftasgUiSGcPN" },
  { title: "Turn Me On", artist: "Norah Jones", year: 2002, uri: "spotify:track:6FjAGZp7c0Z2uaL3eHkXsx" },
  { title: "Hey Ya!", artist: "Outkast", year: 2003, uri: "spotify:track:2PpruBYCo4H7WOBJ7Q2EwM" },
  { title: "Crazy In Love", artist: "Beyoncé, JAŸ-Z", year: 2003, uri: "spotify:track:5IVuqXILoxVWvWEPm82Jxr" },
  { title: "Where Is The Love?", artist: "Black Eyed Peas", year: 2003, uri: "spotify:track:1FreAz1lmnDi5aKLB6GdFM" },
  { title: "Heartbeats", artist: "The Knife", year: 2003, uri: "spotify:track:3kdyKV4Oo0Ogkx2tDJ8oT0" },
  { title: "In Da Club", artist: "50 Cent", year: 2003, uri: "spotify:track:7iL6o9tox1zgHpKUfh9vuC" },
  { title: "Seven Nation Army", artist: "The White Stripes", year: 2003, uri: "spotify:track:4zA30wJPvNvQ3WjB8jtGaF" },
  { title: "Call on Me", artist: "Eric Prydz", year: 2004, uri: "spotify:track:1xNcBAoUw8Hz6LqK2jt4Ff" },
  { title: "Somewhere Only We Know", artist: "Keane", year: 2004, uri: "spotify:track:1SKPmfSYaPsETbRHaiA18G" },
  { title: "Stupidisco", artist: "Junior Jack", year: 2004, uri: "spotify:track:3R2ezKaNvWEvCYoZ0fkxwN" },
  { title: "Numb / Encore", artist: "JAŸ-Z, Linkin Park", year: 2004, uri: "spotify:track:7dyluIqv7QYVTXXZiMWPHW" },
  { title: "Since U Been Gone", artist: "Kelly Clarkson", year: 2004, uri: "spotify:track:3xrn9i8zhNZsTtcoWgQEAd" },
  { title: "How to Save a Life", artist: "The Fray", year: 2005, uri: "spotify:track:5fVZC9GiM4e8vu99W0Xf6J" },
  { title: "Talk", artist: "Coldplay", year: 2005, uri: "spotify:track:4wzt5Rrk3W98pHXAqutuJw" },
  { title: "Gold Digger", artist: "Kanye West, Jamie Foxx", year: 2005, uri: "spotify:track:0Gsj2iZerDbXbU0G1IHuB2" },
  { title: "Put Your Records On", artist: "Corinne Bailey Rae", year: 2006, uri: "spotify:track:2nGFzvICaeEWjIrBrL2RAx" },
  { title: "World Hold on (Children of the Sky)", artist: "Bob Sinclar, Steve Edwards", year: 2006, uri: "spotify:track:1c0zagykmGPDYuxJeDqZhJ" },
  { title: "Rehab", artist: "Amy Winehouse", year: 2006, uri: "spotify:track:3N4DI1vuTSX1tz7fa2NQZw" },
  { title: "Say It Right", artist: "Nelly Furtado", year: 2006, uri: "spotify:track:2aI21FnmY7TJVKeMaoQZ0t" },
  { title: "Waiting On the World to Change", artist: "John Mayer", year: 2006, uri: "spotify:track:5imShWWzwqfAJ9gXFpGAQh" },
  { title: "Crazy", artist: "Gnarls Barkley, CeeLo Green, Danger Mouse", year: 2006, uri: "spotify:track:6FlAGda9qkDhTU7ctFM4uG" },
  { title: "The Way I Are", artist: "Timbaland, Keri Hilson, D.O.E.", year: 2007, uri: "spotify:track:4WZYBWngq9ODEqPB05WW7S" },
  { title: "Bleeding Love", artist: "Leona Lewis", year: 2007, uri: "spotify:track:7wZUrN8oemZfsEd1CGkbXE" },
  { title: "Girlfriend", artist: "Avril Lavigne", year: 2007, uri: "spotify:track:5xv4ggemGPNpowZAMwEYHH" },
  { title: "No One", artist: "Alicia Keys", year: 2007, uri: "spotify:track:4ZoffM8qkSNg9uwLq3DQY7" },
  { title: "Use Somebody", artist: "Kings of Leon", year: 2008, uri: "spotify:track:5VGlqQANWDKJFl0MBG3sg2" },
  { title: "Mercy", artist: "Duffy", year: 2008, uri: "spotify:track:78twQ5XCFJMTE37ZSU0gsj" },
  { title: "Human", artist: "The Killers", year: 2008, uri: "spotify:track:2uun7r1VosRzqTQZmffCu6" },
  { title: "Poker Face", artist: "Lady Gaga", year: 2008, uri: "spotify:track:5R8dQOPq8haW94K7mgERlO" },
  { title: "Sweet About Me", artist: "Gabriella Cilmi", year: 2008, uri: "spotify:track:5wznxkB792LjSRdbZ1J1zo" },
  { title: "Fireflies", artist: "Owl City", year: 2009, uri: "spotify:track:1mr3616BzLdhXfJmLmRsO8" },
  { title: "Whatcha Say", artist: "Jason Derulo", year: 2009, uri: "spotify:track:3B1dszUJvlEpVbzTHIlLxv" },
  { title: "Raise Your Glass", artist: "P!nk", year: 2010, uri: "spotify:track:1gv4xPanImH17bKZ9rOveR" },
  { title: "The Lazy Song", artist: "Bruno Mars", year: 2010, uri: "spotify:track:1ExfPZEiahqhLyajhybFeS" },
  { title: "Waka Waka (This Time for Africa)", artist: "Shakira, Freshlyground", year: 2010, uri: "spotify:track:2Cd9iWfcOpGDHLz6tVA3G4" },
  { title: "Firework", artist: "Katy Perry", year: 2010, uri: "spotify:track:1mXuMM6zjPgjL4asbBsgnt" },
  { title: "You've Got The Love", artist: "Florence + The Machine", year: 2010, uri: "spotify:track:0fPf9CDFzVnHpcfld5XVtO" },
  { title: "Dancing On My Own", artist: "Robyn", year: 2010, uri: "spotify:track:2b712q3E27nyW6LGsZxr0y" },
  { title: "Dynamite", artist: "Taio Cruz", year: 2010, uri: "spotify:track:2srTtSrzY4n10C7abVTrBm" },
  { title: "Levels", artist: "Avicii", year: 2011, uri: "spotify:track:5UqCQaDshqbIk3pkhy4Pjg" },
  { title: "Set Fire to the Rain", artist: "Adele", year: 2011, uri: "spotify:track:5PKWUDfQFtc5qqo8cs1gQp" },
  { title: "Somebody That I Used To Know", artist: "Gotye, Kimbra", year: 2011, uri: "spotify:track:4VRLGNMTfymoYzD4dLAsNb" },
  { title: "Price Tag", artist: "Jessie J, B.o.B", year: 2011, uri: "spotify:track:7nqlRkgNyEpb9nvb03GMp7" },
  { title: "Moves Like Jagger", artist: "Maroon 5, Christina Aguilera", year: 2011, uri: "spotify:track:0HqeTDZMGlYDmgGGVFQrSg" },
  { title: "I Love It", artist: "Icona Pop, Charli xcx", year: 2012, uri: "spotify:track:27ilMN1oiW9849fReEYgOj" },
  { title: "Can't Hold Us", artist: "Macklemore, Ryan Lewis, Macklemore & Ryan Lewis, Ray Dalton", year: 2012, uri: "spotify:track:3bidbhpOYeV4knp8AIu8Xn" },
  { title: "Euphoria", artist: "Loreen", year: 2012, uri: "spotify:track:1xN7BpTAWnZkuSLOtRP6Qc" },
  { title: "Happy", artist: "Pharrell Williams", year: 2013, uri: "spotify:track:5b88tNINg4Q4nrRbrCXUmg" },
  { title: "All of Me", artist: "John Legend", year: 2013, uri: "spotify:track:3U4isOIWM3VvDubwSI3y7a" },
  { title: "Royals", artist: "Lorde", year: 2013, uri: "spotify:track:2dLLR6qlu5UJ5gk0dKz0h3" },
  { title: "Wrecking Ball", artist: "Miley Cyrus", year: 2013, uri: "spotify:track:2vwlzO0Qp8kfEtzTsCXfyE" },
  { title: "Riptide", artist: "Vance Joy", year: 2013, uri: "spotify:track:423RKXolCbgBbkF8WanOwA" },
  { title: "Habits (Stay High)", artist: "Tove Lo", year: 2014, uri: "spotify:track:18AJRdgUoO9EYn11N7xzaT" },
  { title: "Chandelier", artist: "Sia", year: 2014, uri: "spotify:track:4VrWlk8IQxevMvERoX08iC" },
  { title: "Budapest", artist: "George Ezra", year: 2014, uri: "spotify:track:7GJClzimvMSghjcrKxuf1M" },
  { title: "All About That Bass", artist: "Meghan Trainor", year: 2014, uri: "spotify:track:0ifSeVGUr7py5GggttDhXw" },
  { title: "Shut Up and Dance", artist: "WALK THE MOON", year: 2014, uri: "spotify:track:4kbj5MwxO1bq9wjT5g9HaA" },
  { title: "FourFiveSeconds", artist: "Rihanna, Kanye West, Paul McCartney", year: 2015, uri: "spotify:track:5XzmZjXhMjDHr7ZfJ6DELQ" },
  { title: "Geronimo", artist: "Sheppard", year: 2015, uri: "spotify:track:2RfM3MKoo4BHWTAQsfXRSo" },
  { title: "Lush Life", artist: "Zara Larsson", year: 2015, uri: "spotify:track:2YYt1dJwu99XCVwH8yyOPR" },
  { title: "Say You Won't Let Go", artist: "James Arthur", year: 2016, uri: "spotify:track:5uCax9HTNlzGybIStD3vDh" },
  { title: "Scars To Your Beautiful", artist: "Alessia Cara", year: 2016, uri: "spotify:track:42ydLwx4i5V49RXHOozJZq" },
  { title: "Thunder", artist: "Imagine Dragons", year: 2017, uri: "spotify:track:1zB4vmk8tFRmM9UULNzbLB" },
  { title: "Feel It Still", artist: "Portugal. The Man", year: 2017, uri: "spotify:track:6QgjcU0zLnzq5OrUoSZ3OK" },
  { title: "Shallow", artist: "Lady Gaga, Bradley Cooper", year: 2018, uri: "spotify:track:6QfS2wq5sSC1xAJCQsTSlj" },
  { title: "Someone You Loved", artist: "Lewis Capaldi", year: 2018, uri: "spotify:track:2TIlqbIneP0ZY1O0EzYLlc" },
  { title: "Circles", artist: "Post Malone", year: 2019, uri: "spotify:track:21jGcNKet2qwijlDFuPiPb" },
  { title: "Adore You", artist: "Harry Styles", year: 2019, uri: "spotify:track:3jjujdWJ72nww5eGnfs2E7" },
  { title: "Old Town Road", artist: "Lil Nas X", year: 2019, uri: "spotify:track:0F7FA14euOIX8KcbEturGH" },
  { title: "Señorita", artist: "Shawn Mendes, Camila Cabello", year: 2019, uri: "spotify:track:0TK2YIli7K1leLovkQiNik" },
  { title: "Don't Call Me Up", artist: "Mabel", year: 2019, uri: "spotify:track:5Xc9L411IGVexidbaF7CHG" },
  { title: "Dance Monkey", artist: "Tones And I", year: 2019, uri: "spotify:track:5ZULALImTm80tzUbYQYM9d" },
  { title: "bad guy", artist: "Billie Eilish", year: 2019, uri: "spotify:track:2Fxmhks0bxGSBdJ92vM42m" },
  { title: "Break My Heart", artist: "Dua Lipa", year: 2020, uri: "spotify:track:017PF4Q3l4DBUiWoXk4OWT" },
  { title: "Toosie Slide", artist: "Drake", year: 2020, uri: "spotify:track:127QTOFJsJQp5LbJbu3A1y" },
  { title: "Blinding Lights", artist: "The Weeknd", year: 2020, uri: "spotify:track:6qYkmqFsXbj8CQjAdbYz07" },
  { title: "Anyone", artist: "Justin Bieber", year: 2021, uri: "spotify:track:31qCy5ZaophVA81wtlwLc4" },
  { title: "drivers license", artist: "Olivia Rodrigo", year: 2021, uri: "spotify:track:7lPN2DXiMsVn7XUKtOW1CS" },
  // ── added to reach 500 (resolved via Spotify Search at play time) ──
  { title: "Great Balls of Fire", artist: "Jerry Lee Lewis", year: 1957 },
  { title: "That'll Be the Day", artist: "Buddy Holly", year: 1957 },
  { title: "Blueberry Hill", artist: "Fats Domino", year: 1956 },
  { title: "Peggy Sue", artist: "Buddy Holly", year: 1957 },
  { title: "Yakety Yak", artist: "The Coasters", year: 1958 },
  { title: "Sweet Little Sixteen", artist: "Chuck Berry", year: 1958 },
  { title: "Wake Up Little Susie", artist: "The Everly Brothers", year: 1957 },
  { title: "At the Hop", artist: "Danny & The Juniors", year: 1957 },
  { title: "Splish Splash", artist: "Bobby Darin", year: 1958 },
  { title: "Twist and Shout", artist: "The Beatles", year: 1963 },
  { title: "She Loves You", artist: "The Beatles", year: 1963 },
  { title: "California Dreamin'", artist: "The Mamas & The Papas", year: 1965 },
  { title: "My Generation", artist: "The Who", year: 1965 },
  { title: "Paint It Black", artist: "The Rolling Stones", year: 1966 },
  { title: "Brown Eyed Girl", artist: "Van Morrison", year: 1967 },
  { title: "A Whiter Shade of Pale", artist: "Procol Harum", year: 1967 },
  { title: "All You Need Is Love", artist: "The Beatles", year: 1967 },
  { title: "Mrs. Robinson", artist: "Simon & Garfunkel", year: 1968 },
  { title: "Jumpin' Jack Flash", artist: "The Rolling Stones", year: 1968 },
  { title: "Purple Haze", artist: "Jimi Hendrix", year: 1967 },
  { title: "(Sittin' On) The Dock of the Bay", artist: "Otis Redding", year: 1968 },
  { title: "Bad Moon Rising", artist: "Creedence Clearwater Revival", year: 1969 },
  { title: "Proud Mary", artist: "Creedence Clearwater Revival", year: 1969 },
  { title: "Gimme Shelter", artist: "The Rolling Stones", year: 1969 },
  { title: "Space Oddity", artist: "David Bowie", year: 1969 },
  { title: "Suspicious Minds", artist: "Elvis Presley", year: 1969 },
  { title: "Wild Thing", artist: "The Troggs", year: 1966 },
  { title: "Dancing in the Street", artist: "Martha and the Vandellas", year: 1964 },
  { title: "Baby Love", artist: "The Supremes", year: 1964 },
  { title: "Gimme Some Lovin'", artist: "The Spencer Davis Group", year: 1966 },
  { title: "Waterloo Sunset", artist: "The Kinks", year: 1967 },
  { title: "American Pie", artist: "Don McLean", year: 1971 },
  { title: "Maggie May", artist: "Rod Stewart", year: 1971 },
  { title: "Take Me Home, Country Roads", artist: "John Denver", year: 1971 },
  { title: "Lean on Me", artist: "Bill Withers", year: 1972 },
  { title: "Rocket Man", artist: "Elton John", year: 1972 },
  { title: "School's Out", artist: "Alice Cooper", year: 1972 },
  { title: "Money", artist: "Pink Floyd", year: 1973 },
  { title: "Goodbye Yellow Brick Road", artist: "Elton John", year: 1973 },
  { title: "The Joker", artist: "Steve Miller Band", year: 1973 },
  { title: "Killer Queen", artist: "Queen", year: 1974 },
  { title: "Kung Fu Fighting", artist: "Carl Douglas", year: 1974 },
  { title: "Born to Run", artist: "Bruce Springsteen", year: 1975 },
  { title: "Wish You Were Here", artist: "Pink Floyd", year: 1975 },
  { title: "Mamma Mia", artist: "ABBA", year: 1975 },
  { title: "Y.M.C.A.", artist: "Village People", year: 1978 },
  { title: "Heart of Glass", artist: "Blondie", year: 1979 },
  { title: "Sultans of Swing", artist: "Dire Straits", year: 1978 },
  { title: "Rapper's Delight", artist: "The Sugarhill Gang", year: 1979 },
  { title: "Don't Stop 'Til You Get Enough", artist: "Michael Jackson", year: 1979 },
  { title: "Good Times", artist: "Chic", year: 1979 },
  { title: "Lola", artist: "The Kinks", year: 1970 },
  { title: "Take It Easy", artist: "Eagles", year: 1972 },
  { title: "Billie Jean", artist: "Michael Jackson", year: 1983 },
  { title: "Beat It", artist: "Michael Jackson", year: 1983 },
  { title: "Thriller", artist: "Michael Jackson", year: 1982 },
  { title: "Take On Me", artist: "a-ha", year: 1985 },
  { title: "Girls Just Want to Have Fun", artist: "Cyndi Lauper", year: 1983 },
  { title: "Time After Time", artist: "Cyndi Lauper", year: 1984 },
  { title: "Material Girl", artist: "Madonna", year: 1984 },
  { title: "Like a Virgin", artist: "Madonna", year: 1984 },
  { title: "Wake Me Up Before You Go-Go", artist: "Wham!", year: 1984 },
  { title: "Livin' on a Prayer", artist: "Bon Jovi", year: 1986 },
  { title: "Never Gonna Give You Up", artist: "Rick Astley", year: 1987 },
  { title: "Come On Eileen", artist: "Dexys Midnight Runners", year: 1982 },
  { title: "Hungry Like the Wolf", artist: "Duran Duran", year: 1982 },
  { title: "Eye of the Tiger", artist: "Survivor", year: 1982 },
  { title: "Jump", artist: "Van Halen", year: 1984 },
  { title: "Money for Nothing", artist: "Dire Straits", year: 1985 },
  { title: "Should I Stay or Should I Go", artist: "The Clash", year: 1982 },
  { title: "Rock the Casbah", artist: "The Clash", year: 1982 },
  { title: "99 Luftballons", artist: "Nena", year: 1983 },
  { title: "Everybody Wants to Rule the World", artist: "Tears for Fears", year: 1985 },
  { title: "Shout", artist: "Tears for Fears", year: 1984 },
  { title: "Total Eclipse of the Heart", artist: "Bonnie Tyler", year: 1983 },
  { title: "Walking on Sunshine", artist: "Katrina & The Waves", year: 1985 },
  { title: "Addicted to Love", artist: "Robert Palmer", year: 1986 },
  { title: "Faith", artist: "George Michael", year: 1987 },
  { title: "Need You Tonight", artist: "INXS", year: 1987 },
  { title: "Walk This Way", artist: "Run-D.M.C. & Aerosmith", year: 1986 },
  { title: "Personal Jesus", artist: "Depeche Mode", year: 1989 },
  { title: "Pride (In the Name of Love)", artist: "U2", year: 1984 },
  { title: "Where the Streets Have No Name", artist: "U2", year: 1987 },
  { title: "Blue Monday", artist: "New Order", year: 1983 },
  { title: "Once in a Lifetime", artist: "Talking Heads", year: 1981 },
  { title: "Pour Some Sugar on Me", artist: "Def Leppard", year: 1987 },
  { title: "Papa Don't Preach", artist: "Madonna", year: 1986 },
  { title: "Enter Sandman", artist: "Metallica", year: 1991 },
  { title: "Jeremy", artist: "Pearl Jam", year: 1992 },
  { title: "Black Hole Sun", artist: "Soundgarden", year: 1994 },
  { title: "Don't Look Back in Anger", artist: "Oasis", year: 1996 },
  { title: "Champagne Supernova", artist: "Oasis", year: 1996 },
  { title: "Common People", artist: "Pulp", year: 1995 },
  { title: "Song 2", artist: "Blur", year: 1997 },
  { title: "1979", artist: "The Smashing Pumpkins", year: 1996 },
  { title: "Juicy", artist: "The Notorious B.I.G.", year: 1994 },
  { title: "Nuthin' but a G Thang", artist: "Dr. Dre", year: 1992 },
  { title: "C.R.E.A.M.", artist: "Wu-Tang Clan", year: 1993 },
  { title: "No Scrubs", artist: "TLC", year: 1999 },
  { title: "Say My Name", artist: "Destiny's Child", year: 1999 },
  { title: "I Want It That Way", artist: "Backstreet Boys", year: 1999 },
  { title: "Barbie Girl", artist: "Aqua", year: 1997 },
  { title: "What Is Love", artist: "Haddaway", year: 1993 },
  { title: "Blue (Da Ba Dee)", artist: "Eiffel 65", year: 1999 },
  { title: "Around the World", artist: "Daft Punk", year: 1997 },
  { title: "Firestarter", artist: "The Prodigy", year: 1996 },
  { title: "Ironic", artist: "Alanis Morissette", year: 1995 },
  { title: "You Oughta Know", artist: "Alanis Morissette", year: 1995 },
  { title: "Kiss from a Rose", artist: "Seal", year: 1994 },
  { title: "All Star", artist: "Smash Mouth", year: 1999 },
  { title: "Semi-Charmed Life", artist: "Third Eye Blind", year: 1997 },
  { title: "No Rain", artist: "Blind Melon", year: 1993 },
  { title: "Sabotage", artist: "Beastie Boys", year: 1994 },
  { title: "Cotton Eye Joe", artist: "Rednex", year: 1994 },
  { title: "Rhythm Is a Dancer", artist: "Snap!", year: 1992 },
  { title: "Say You'll Be There", artist: "Spice Girls", year: 1996 },
  { title: "Everlong", artist: "Foo Fighters", year: 1997 },
  { title: "Music Sounds Better with You", artist: "Stardust", year: 1998 },
  { title: "Insomnia", artist: "Faithless", year: 1995 },
  { title: "3AM", artist: "Matchbox Twenty", year: 1997 },
  { title: "One Week", artist: "Barenaked Ladies", year: 1998 },
  { title: "Linger", artist: "The Cranberries", year: 1993 },
  { title: "Yellow", artist: "Coldplay", year: 2000 },
  { title: "Clocks", artist: "Coldplay", year: 2002 },
  { title: "Last Nite", artist: "The Strokes", year: 2001 },
  { title: "Take Me Out", artist: "Franz Ferdinand", year: 2004 },
  { title: "I Bet You Look Good on the Dancefloor", artist: "Arctic Monkeys", year: 2005 },
  { title: "American Idiot", artist: "Green Day", year: 2004 },
  { title: "Boulevard of Broken Dreams", artist: "Green Day", year: 2004 },
  { title: "In the End", artist: "Linkin Park", year: 2001 },
  { title: "Numb", artist: "Linkin Park", year: 2003 },
  { title: "Bring Me to Life", artist: "Evanescence", year: 2003 },
  { title: "Chop Suey!", artist: "System of a Down", year: 2001 },
  { title: "Complicated", artist: "Avril Lavigne", year: 2002 },
  { title: "Hollaback Girl", artist: "Gwen Stefani", year: 2005 },
  { title: "SexyBack", artist: "Justin Timberlake", year: 2006 },
  { title: "Yeah!", artist: "Usher", year: 2004 },
  { title: "Stronger", artist: "Kanye West", year: 2007 },
  { title: "Just Dance", artist: "Lady Gaga", year: 2008 },
  { title: "I Kissed a Girl", artist: "Katy Perry", year: 2008 },
  { title: "Low", artist: "Flo Rida", year: 2007 },
  { title: "Valerie", artist: "Mark Ronson", year: 2007 },
  { title: "Paper Planes", artist: "M.I.A.", year: 2007 },
  { title: "Kids", artist: "MGMT", year: 2007 },
  { title: "Sex on Fire", artist: "Kings of Leon", year: 2008 },
  { title: "Welcome to the Black Parade", artist: "My Chemical Romance", year: 2006 },
  { title: "Sugar, We're Goin Down", artist: "Fall Out Boy", year: 2005 },
  { title: "The Scientist", artist: "Coldplay", year: 2002 },
  { title: "Hey There Delilah", artist: "Plain White T's", year: 2006 },
  { title: "Are You Gonna Be My Girl", artist: "Jet", year: 2003 },
  { title: "Get the Party Started", artist: "Pink", year: 2001 },
  { title: "1901", artist: "Phoenix", year: 2009 },
  { title: "Pumped Up Kicks", artist: "Foster the People", year: 2011 },
  { title: "We Found Love", artist: "Rihanna", year: 2011 },
  { title: "Titanium", artist: "David Guetta", year: 2011 },
  { title: "Radioactive", artist: "Imagine Dragons", year: 2012 },
  { title: "Ho Hey", artist: "The Lumineers", year: 2012 },
  { title: "Call Me Maybe", artist: "Carly Rae Jepsen", year: 2012 },
  { title: "Locked Out of Heaven", artist: "Bruno Mars", year: 2012 },
  { title: "Counting Stars", artist: "OneRepublic", year: 2013 },
  { title: "Take Me to Church", artist: "Hozier", year: 2013 },
  { title: "Blank Space", artist: "Taylor Swift", year: 2014 },
  { title: "Roar", artist: "Katy Perry", year: 2013 },
  { title: "Sorry", artist: "Justin Bieber", year: 2015 },
  { title: "Cheerleader", artist: "OMI", year: 2014 },
  { title: "Lean On", artist: "Major Lazer", year: 2015 },
  { title: "One Dance", artist: "Drake", year: 2016 },
  { title: "Perfect", artist: "Ed Sheeran", year: 2017 },
  { title: "7 Years", artist: "Lukas Graham", year: 2015 },
  { title: "Stitches", artist: "Shawn Mendes", year: 2015 },
  { title: "rockstar", artist: "Post Malone", year: 2017 },
  { title: "Havana", artist: "Camila Cabello", year: 2017 },
  { title: "New Rules", artist: "Dua Lipa", year: 2017 },
  { title: "Stay With Me", artist: "Sam Smith", year: 2014 },
  { title: "High Hopes", artist: "Panic! at the Disco", year: 2018 },
  { title: "7 rings", artist: "Ariana Grande", year: 2019 },
  { title: "Truth Hurts", artist: "Lizzo", year: 2019 },
  { title: "We Are Young", artist: "fun.", year: 2011 },
  { title: "Timber", artist: "Pitbull", year: 2013 },
  { title: "Watermelon Sugar", artist: "Harry Styles", year: 2020 },
  { title: "Levitating", artist: "Dua Lipa", year: 2020 },
  { title: "Save Your Tears", artist: "The Weeknd", year: 2020 },
  { title: "good 4 u", artist: "Olivia Rodrigo", year: 2021 },
  { title: "Stay", artist: "The Kid LAROI", year: 2021 },
  { title: "Heat Waves", artist: "Glass Animals", year: 2020 },
  { title: "As It Was", artist: "Harry Styles", year: 2022 },
  { title: "Anti-Hero", artist: "Taylor Swift", year: 2022 },
  { title: "Flowers", artist: "Miley Cyrus", year: 2023 },
  { title: "Unholy", artist: "Sam Smith", year: 2022 },
  { title: "Kill Bill", artist: "SZA", year: 2022 },
  { title: "Espresso", artist: "Sabrina Carpenter", year: 2024 },
  { title: "Texas Hold 'Em", artist: "Beyoncé", year: 2024 },
  { title: "Paint the Town Red", artist: "Doja Cat", year: 2023 },
  { title: "vampire", artist: "Olivia Rodrigo", year: 2023 },
  { title: "Calm Down", artist: "Rema", year: 2022 },
  { title: "Leave the Door Open", artist: "Silk Sonic", year: 2021 },
  { title: "About Damn Time", artist: "Lizzo", year: 2022 },
  { title: "Beautiful Things", artist: "Benson Boone", year: 2024 },
  { title: "Birds of a Feather", artist: "Billie Eilish", year: 2024 },
];

const SCOPES = [
  "streaming",
  "user-read-email",
  "user-read-private",
  "user-modify-playback-state",
  "user-read-playback-state",
  "playlist-read-private",
  "playlist-read-collaborative",
].join(" ");

// Bump when SCOPES change so cached tokens with old scopes are discarded
// and the user is forced to re-authorize.
// Bumped to 3 so existing sessions re-authorize once and pick up a stored
// refresh token (enables silent token renewal / no mid-game disconnects).
const SCOPE_VERSION = "3";

// Redirect back to this exact page (no query/hash) — must match the
// Redirect URI registered in the Spotify dashboard.
const REDIRECT_URI = window.location.origin + window.location.pathname;

const LS = {
  clientId: "hitster_client_id",
  playlist: "hitster_playlist",
  verifier: "hitster_pkce_verifier",
  token: "hitster_token",
  refresh: "hitster_refresh",
  scopeV: "hitster_scope_v",
  shoe: "hitster_shoe",
  shoeV: "hitster_shoe_v",
};

// Bump when BUILTIN_DECK changes so the persisted shoe rebuilds with new songs.
const DECK_VERSION = "2";

/* ---------------------------- state ---------------------------- */
const state = {
  token: null,
  tokenExpiry: 0,
  refreshToken: null,
  refreshTimer: null,
  player: null,        // Web Playback SDK player (desktop in-browser device)
  sdkDeviceId: null,   // device id of the in-browser SDK player
  deviceId: null,      // currently selected playback target (any device)
  useBuiltin: false,   // play from the built-in deck instead of a playlist
  shoe: null,          // persistent shuffled built-in deck (spans games)
  deck: [],            // remaining track pool for the current game
  current: null,       // track being guessed this turn
  players: [],         // {name, timeline:[track], tokens}
  turn: 0,
  targetCards: 10,
  startTokens: 2,
  maxTokens: 3,
  awaitingNext: false,
  activePlacement: null, // slot the active player chose this turn
  steals: [],            // [{playerIndex, slotIndex}] challenges this turn
  stealing: null,        // player index currently placing a steal
  namingClaimed: false,
  namingPenalized: null, // Set of player indices already penalised this turn
};

/* ---------------------------- helpers ---------------------------- */
const $ = (id) => document.getElementById(id);

function toast(msg, ms = 2600) {
  const t = $("toast");
  t.textContent = msg;
  t.classList.remove("hidden");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.add("hidden"), ms);
}

function setStatus(text, cls) {
  const el = $("connection-status");
  el.textContent = text;
  el.className = "status " + cls;
}

function showScreen(id) {
  ["setup-screen", "game-screen", "win-screen"].forEach((s) =>
    $(s).classList.toggle("hidden", s !== id)
  );
}

/* ====================================================================
   PKCE OAUTH
   ==================================================================== */
function randomString(len) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  const arr = crypto.getRandomValues(new Uint8Array(len));
  return Array.from(arr, (b) => chars[b % chars.length]).join("");
}

async function sha256base64url(input) {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function beginLogin() {
  const clientId = $("client-id").value.trim();
  if (!clientId) return toast("Enter your Spotify Client ID first.");
  localStorage.setItem(LS.clientId, clientId);
  localStorage.setItem(LS.playlist, $("playlist-input").value.trim());

  const verifier = randomString(96);
  localStorage.setItem(LS.verifier, verifier);
  const challenge = await sha256base64url(verifier);

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    scope: SCOPES,
    code_challenge_method: "S256",
    code_challenge: challenge,
    redirect_uri: REDIRECT_URI,
  });
  window.location = "https://accounts.spotify.com/authorize?" + params;
}

async function exchangeToken(code) {
  const clientId = localStorage.getItem(LS.clientId);
  const verifier = localStorage.getItem(LS.verifier);
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: REDIRECT_URI,
    client_id: clientId,
    code_verifier: verifier,
  });
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) throw new Error("Token exchange failed: " + (await res.text()));
  return res.json();
}

function storeToken(data) {
  state.token = data.access_token;
  state.tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
  localStorage.setItem(
    LS.token,
    JSON.stringify({ access_token: state.token, expiry: state.tokenExpiry })
  );
  // PKCE refresh tokens rotate — keep the newest one Spotify returns.
  if (data.refresh_token) {
    state.refreshToken = data.refresh_token;
    localStorage.setItem(LS.refresh, data.refresh_token);
  }
  localStorage.setItem(LS.scopeV, SCOPE_VERSION);
  scheduleRefresh();
}

function loadStoredToken() {
  try {
    if (localStorage.getItem(LS.scopeV) !== SCOPE_VERSION) return false;
    state.refreshToken = localStorage.getItem(LS.refresh) || null;
    const raw = JSON.parse(localStorage.getItem(LS.token));
    if (raw && raw.expiry > Date.now()) {
      state.token = raw.access_token;
      state.tokenExpiry = raw.expiry;
      scheduleRefresh();
      return true;
    }
  } catch (_) {}
  return false;
}

/* Renew the access token with the stored refresh token (no user action). */
let refreshInFlight = null;
function refreshAccessToken() {
  if (refreshInFlight) return refreshInFlight;
  const clientId = localStorage.getItem(LS.clientId);
  const refresh = state.refreshToken || localStorage.getItem(LS.refresh);
  if (!clientId || !refresh) return Promise.reject(new Error("no refresh token"));

  refreshInFlight = fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refresh,
      client_id: clientId,
    }),
  })
    .then(async (res) => {
      if (!res.ok) throw new Error("refresh failed: " + (await res.text()));
      const data = await res.json();
      storeToken(data);
      return state.token;
    })
    .finally(() => {
      refreshInFlight = null;
    });
  return refreshInFlight;
}

/* Refresh a little before the token actually expires so playback never drops. */
function scheduleRefresh() {
  clearTimeout(state.refreshTimer);
  if (!state.refreshToken) return;
  const ms = state.tokenExpiry - Date.now() - 60000; // ~1 min before expiry
  state.refreshTimer = setTimeout(
    () => refreshAccessToken().catch(() => setStatus("Reconnect needed", "disconnected")),
    Math.max(5000, ms)
  );
}

/* ====================================================================
   SPOTIFY WEB API
   ==================================================================== */
async function api(path, options = {}, _retried = false) {
  const res = await fetch("https://api.spotify.com/v1" + path, {
    ...options,
    headers: {
      Authorization: "Bearer " + state.token,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  if (res.status === 401 && !_retried) {
    // token expired mid-request — silently renew and retry once
    try {
      await refreshAccessToken();
      return api(path, options, true);
    } catch (_) {
      throw new Error("Spotify session expired — reconnect.");
    }
  }
  if (res.status === 401) throw new Error("Spotify session expired — reconnect.");
  if (!res.ok && res.status !== 204) {
    const endpoint = path.split("?")[0];
    let msg = `Spotify API error ${res.status} on ${endpoint}`;
    if (res.status === 403) {
      msg += " (Forbidden — usually a private playlist needing reconnection, " +
             "or an account that isn't Premium)";
    }
    const body = await res.text();
    throw new Error(msg + (body ? ": " + body : ""));
  }
  return res.status === 204 ? null : res.json();
}

function parsePlaylistId(input) {
  input = input.trim();
  // spotify:playlist:ID  |  https://open.spotify.com/playlist/ID?...  |  raw ID
  let m = input.match(/playlist[:/]([a-zA-Z0-9]+)/);
  if (m) return m[1];
  if (/^[a-zA-Z0-9]+$/.test(input)) return input;
  return null;
}

async function loadDeck(playlistInput) {
  const id = parsePlaylistId(playlistInput);
  if (!id) throw new Error("Couldn't read a playlist ID from that link.");

  const tracks = [];
  let url =
    `/playlists/${id}/tracks?limit=100&fields=` +
    encodeURIComponent(
      "next,items(track(uri,name,artists(name),album(release_date,release_date_precision)))"
    );

  while (url) {
    let page;
    try {
      page = await api(url);
    } catch (e) {
      if (/error 40[34]/.test(e.message)) {
        throw new Error(
          "Can't read that playlist. Spotify blocks its own personalized/editorial " +
          "playlists (Daily Mix, Discover Weekly, Blends, 'Your Top Songs', etc.). " +
          "Use a normal playlist that a person created and set to Public — e.g. make " +
          "your own playlist, add songs, set it Public, and paste that link."
        );
      }
      throw e;
    }
    for (const item of page.items || []) {
      const t = item.track;
      if (!t || !t.uri || !t.album || !t.album.release_date) continue;
      const year = parseInt(t.album.release_date.slice(0, 4), 10);
      if (!year) continue;
      tracks.push({
        uri: t.uri,
        name: t.name,
        artist: (t.artists || []).map((a) => a.name).join(", "),
        year,
      });
    }
    url = page.next ? page.next.replace("https://api.spotify.com/v1", "") : null;
  }

  if (tracks.length < 5) {
    throw new Error("Need at least 5 playable songs in the playlist — found " + tracks.length + ".");
  }
  return shuffle(tracks);
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/* Build a deck from the built-in song list. Entries carry their real Spotify
   URI, so no lookup is needed; any without one fall back to Search at play. */
function builtinDeck() {
  return shuffle(
    BUILTIN_DECK.map((s) => ({ uri: s.uri || null, name: s.title, artist: s.artist, year: s.year }))
  );
}

/* Resolve a built-in card to a real Spotify track via the Search API. */
async function resolveUri(card) {
  const q = `track:${card.name} artist:${card.artist}`;
  const data = await api(`/search?type=track&limit=1&market=from_token&q=${encodeURIComponent(q)}`);
  const item = data && data.tracks && data.tracks.items && data.tracks.items[0];
  if (!item || !item.uri) throw new Error("not found");
  card.uri = item.uri;
}

async function playTrack(uri) {
  if (!state.deviceId) {
    if (!(await recoverDevice())) throw noDeviceError();
  }
  try {
    await sendPlay(uri);
  } catch (e) {
    // device went idle/away (404 Device not found) — find a live one, retry once
    if (/error 404/.test(e.message) || /device/i.test(e.message)) {
      showGameDeviceBar();
      if (!(await recoverDevice())) throw noDeviceError();
      await sendPlay(uri);
    } else {
      throw e;
    }
  }
}

function sendPlay(uri) {
  return api(`/me/player/play?device_id=${state.deviceId}`, {
    method: "PUT",
    body: JSON.stringify({ uris: [uri] }),
  });
}

function noDeviceError() {
  return new Error(
    "Playback device not found. Open the Spotify app on your phone, play any song for " +
    "a second, then tap 🔊 Device (top of screen) to reselect — then press Play again."
  );
}

function showGameDeviceBar() {
  const bar = $("game-device-bar");
  if (bar) bar.classList.remove("hidden");
}

async function pausePlayback() {
  // Works for any active device (in-browser SDK or a phone's Spotify app).
  try {
    await api("/me/player/pause", { method: "PUT" });
  } catch (_) {
    /* nothing playing — ignore */
  }
}

async function listDevices() {
  const data = await api("/me/player/devices");
  return (data && data.devices) || [];
}

/* ====================================================================
   WEB PLAYBACK SDK
   ==================================================================== */
function initPlayer() {
  return new Promise((resolve, reject) => {
    const ready = () => {
      const player = new Spotify.Player({
        name: "Hitster Web Edition",
        getOAuthToken: async (cb) => {
          // hand the SDK a fresh token (it re-requests this near expiry)
          if (Date.now() > state.tokenExpiry - 30000) {
            try { await refreshAccessToken(); } catch (_) {}
          }
          cb(state.token);
        },
        volume: 0.8,
      });

      player.addListener("ready", ({ device_id }) => {
        state.sdkDeviceId = device_id;
        state.player = player;
        resolve(player);
      });
      player.addListener("not_ready", () => {});
      player.addListener("initialization_error", ({ message }) => reject(new Error(message)));
      player.addListener("authentication_error", ({ message }) => {
        // token went stale — renew and let the SDK reconnect
        refreshAccessToken()
          .then(() => player.connect())
          .catch(() => reject(new Error(message)));
      });
      player.addListener("account_error", () =>
        reject(new Error("This requires a Spotify Premium account."))
      );
      player.connect();
    };

    if (window.Spotify) ready();
    else window.onSpotifyWebPlaybackSDKReady = ready;
  });
}

/* ====================================================================
   GAME LOGIC
   ==================================================================== */
function drawCard() {
  const card = state.deck.pop();
  if (state.useBuiltin) saveShoe(); // persist the built-in "shoe" as it's used
  return card;
}

/* The built-in "shoe": a shuffled 301-card deck that persists across games so
   songs don't repeat until the whole deck has been played through. */
function loadShoe() {
  try {
    if (localStorage.getItem(LS.shoeV) !== DECK_VERSION) return; // deck changed → rebuild
    const raw = JSON.parse(localStorage.getItem(LS.shoe));
    if (Array.isArray(raw) && raw.length) state.shoe = raw;
  } catch (_) {}
}
function saveShoe() {
  try {
    localStorage.setItem(LS.shoe, JSON.stringify(state.deck));
    localStorage.setItem(LS.shoeV, DECK_VERSION);
  } catch (_) {}
}
function reshuffleShoe() {
  state.shoe = builtinDeck();
  localStorage.setItem(LS.shoe, JSON.stringify(state.shoe));
  updateShoeInfo();
  toast(`Deck reshuffled — all ${BUILTIN_DECK.length} songs back in play.`);
}
function updateShoeInfo() {
  const el = $("shoe-info");
  if (!el) return;
  const left = Array.isArray(state.shoe) ? state.shoe.length : BUILTIN_DECK.length;
  el.textContent = `🎵 ${left} of ${BUILTIN_DECK.length} songs left before a reshuffle.`;
  el.classList.toggle("hidden", !state.useBuiltin);
}

function currentPlayer() {
  return state.players[state.turn];
}

/** Is year Y correctly placed at slotIndex of the given (sorted) timeline? */
function isCorrectPlacement(timeline, slotIndex, year) {
  const left = slotIndex > 0 ? timeline[slotIndex - 1].year : -Infinity;
  const right = slotIndex < timeline.length ? timeline[slotIndex].year : Infinity;
  return left <= year && year <= right;
}

function insertSorted(timeline, card) {
  timeline.push(card);
  timeline.sort((a, b) => a.year - b.year);
}

function startGame() {
  // Each player starts with one revealed card on their timeline + tokens.
  for (const p of state.players) {
    p.timeline = [];
    p.tokens = state.startTokens;
    insertSorted(p.timeline, drawCard());
  }
  state.turn = 0;
  state.current = null;
  state.awaitingNext = false;
  showScreen("game-screen");
  renderGame();
}

function renderScoreboard(containerId) {
  const c = $(containerId);
  c.innerHTML = "";
  state.players.forEach((p, i) => {
    const chip = document.createElement("div");
    chip.className = "score-chip" + (i === state.turn ? " active" : "");
    chip.innerHTML =
      `${escapeHtml(p.name)}<span class="pts">${p.timeline.length}/${state.targetCards}</span>` +
      `<span class="tokens">${"🪙".repeat(p.tokens) || "—"}</span>`;
    c.appendChild(chip);
  });
}

function renderGame() {
  // clear per-turn challenge state
  state.activePlacement = null;
  state.steals = [];
  state.stealing = null;

  renderScoreboard("scoreboard");
  $("turn-player").textContent = currentPlayer().name;
  $("timeline-owner").textContent = "Your timeline";
  $("timeline-help").textContent =
    "Tap the gap where the mystery song fits by release year (oldest → newest).";

  // reset per-turn UI
  $("now-playing").classList.add("hidden");
  $("reveal").classList.add("hidden");
  $("turn-actions").classList.add("hidden");
  $("challenge-panel").classList.add("hidden");
  $("naming-bonus").classList.add("hidden");
  $("play-btn").disabled = false;
  $("pause-btn").disabled = true;
  $("replay-btn").disabled = true;

  renderTimeline(currentPlayer(), false);
}

/** Render the given player's timeline. If active, slots are clickable. */
function renderTimeline(player, active, onSlotClick) {
  const tl = player.timeline;
  const container = $("timeline");
  container.innerHTML = "";

  if (tl.length === 0) {
    container.innerHTML = '<div class="tl-empty">No cards yet.</div>';
    return;
  }

  for (let i = 0; i <= tl.length; i++) {
    const slot = document.createElement("div");
    slot.className = "tl-slot" + (active ? " active" : "");
    slot.textContent = active ? "+" : "·";
    if (active && onSlotClick) slot.onclick = () => onSlotClick(i);
    container.appendChild(slot);

    if (i < tl.length) {
      const card = document.createElement("div");
      card.className = "tl-card";
      const col = yearColor(tl[i].year);
      card.style.borderTop = `5px solid ${col}`;
      card.innerHTML = `
        <div class="tl-year" style="color:${col}">${tl[i].year}</div>
        <div class="tl-title">${escapeHtml(tl[i].name)}</div>
        <div class="tl-artist">${escapeHtml(tl[i].artist)}</div>`;
      container.appendChild(card);
    }
  }
}

/* Map a release year to a colour along a decade gradient (red→violet). */
function yearColor(year) {
  const min = 1950, max = 2030;
  const t = Math.max(0, Math.min(1, (year - min) / (max - min)));
  const hue = 12 + t * 280; // warm (older) → cool (newer)
  return `hsl(${Math.round(hue)}, 70%, 58%)`;
}

function escapeHtml(s) {
  return (s || "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );
}

async function onPlay() {
  if (!state.current) {
    if (state.deck.length === 0) {
      toast("Deck is empty — no more songs!");
      return;
    }
    state.current = drawCard();
  }
  try {
    $("play-btn").disabled = true;
    // built-in cards have no URI yet — find a playable track (skip any misses)
    let tries = 0;
    while (state.current && !state.current.uri && tries < 6) {
      $("now-playing").classList.remove("hidden");
      $("mystery-label").textContent = "Finding song…";
      try {
        await resolveUri(state.current);
      } catch (_) {
        state.current = state.deck.length ? drawCard() : null;
        tries++;
      }
    }
    if (!state.current || !state.current.uri) {
      throw new Error("Couldn't find a playable track on Spotify.");
    }
    $("mystery-label").textContent = "Mystery song playing…";
    await playTrack(state.current.uri);
    $("now-playing").classList.remove("hidden");
    $("pause-btn").disabled = false;
    $("replay-btn").disabled = false;
    renderTimeline(currentPlayer(), true, makeGuess); // enable guess slots
  } catch (e) {
    $("play-btn").disabled = false;
    toast(e.message);
  }
}

/* ── active player commits a placement → enter steal phase ─────────── */
async function makeGuess(slotIndex) {
  if (!state.current || state.awaitingNext) return;
  await pausePlayback();

  state.activePlacement = slotIndex;
  $("pause-btn").disabled = true;
  $("replay-btn").disabled = true;

  // lock the active player's timeline view
  $("timeline-owner").textContent = `${currentPlayer().name}'s placement (locked)`;
  $("timeline-help").textContent = "";
  renderTimeline(currentPlayer(), false);

  const eligible = state.players.some((p, i) => i !== state.turn && p.tokens > 0);
  if (!eligible) {
    resolveTurn(); // no one can steal — straight to reveal
    return;
  }
  renderChallengePhase();
}

function alreadyStole(playerIndex) {
  return state.steals.some((s) => s.playerIndex === playerIndex);
}

function renderChallengePhase() {
  $("challenge-panel").classList.remove("hidden");
  $("challenge-text").textContent =
    `Other players may spend a 🪙 to pick the correct slot on ${currentPlayer().name}'s ` +
    `timeline. If they're right and ${currentPlayer().name} was wrong, they steal the card.`;

  const wrap = $("challenge-buttons");
  wrap.innerHTML = "";
  state.players.forEach((p, i) => {
    if (i === state.turn) return;
    const btn = document.createElement("button");
    const can = p.tokens > 0 && !alreadyStole(i);
    btn.disabled = !can;
    btn.textContent = alreadyStole(i)
      ? `${p.name} — placed ✓`
      : `${p.name} steal (🪙 ${p.tokens})`;
    btn.onclick = () => startSteal(i);
    wrap.appendChild(btn);
  });
}

function startSteal(playerIndex) {
  const p = state.players[playerIndex];
  if (p.tokens <= 0 || alreadyStole(playerIndex)) return;
  p.tokens -= 1; // token is spent the moment you challenge
  renderScoreboard("scoreboard");

  state.stealing = playerIndex;
  $("challenge-panel").classList.add("hidden");
  const active = currentPlayer();
  $("timeline-owner").textContent = `${p.name}: pick the correct slot to STEAL`;
  $("timeline-help").textContent =
    `Tap the gap where it really belongs on ${active.name}'s timeline. Right + ${active.name} wrong = you take the card.`;
  renderTimeline(active, true, (slot) => {
    state.steals.push({ playerIndex, slotIndex: slot });
    state.stealing = null;
    $("timeline-owner").textContent = `${active.name}'s placement (locked)`;
    $("timeline-help").textContent = "";
    renderTimeline(active, false);
    renderChallengePhase();
  });
}

/* ── reveal the year and resolve the active guess + any steals ─────── */
function resolveTurn() {
  $("challenge-panel").classList.add("hidden");
  const card = state.current;
  const year = card.year;
  const active = currentPlayer();

  const activeCorrect = isCorrectPlacement(active.timeline, state.activePlacement, year);

  let winner = null;
  let outcome = "";
  if (activeCorrect) {
    insertSorted(active.timeline, card);
    winner = active;
    outcome = "✅ Correct — card kept!";
  } else {
    // first challenger (in challenge order) who picked the right slot on the
    // active player's timeline steals the card (onto their own timeline)
    const good = state.steals.find((s) =>
      isCorrectPlacement(active.timeline, s.slotIndex, year)
    );
    if (good) {
      const thief = state.players[good.playerIndex];
      insertSorted(thief.timeline, card);
      winner = thief;
      outcome = `❌ ${active.name} was wrong — 🪙 ${thief.name} stole the card!`;
    } else {
      outcome =
        state.steals.length > 0
          ? "❌ Wrong, and no steal landed — card discarded."
          : "❌ Wrong — card discarded.";
    }
  }

  const r = $("reveal");
  r.className = "reveal " + (winner === active ? "correct" : "wrong");
  r.innerHTML = `
    <div class="year">${year}</div>
    <div class="song-title">${escapeHtml(card.name)}</div>
    <div class="song-artist">${escapeHtml(card.artist)}</div>
    <div class="verdict">${escapeHtml(outcome)}</div>`;
  r.classList.remove("hidden");

  renderTimeline(active, false);
  renderScoreboard("scoreboard");

  state.awaitingNext = true;
  state.current = null;

  // naming bonus: whoever named BOTH title & artist earns a token — the active
  // player has priority, but a challenger who got it (when the active player
  // didn't) takes the token instead.
  renderNamingBonus();

  if (winner && winner.timeline.length >= state.targetCards) {
    setTimeout(() => endGame(winner), 1400);
  } else {
    $("turn-actions").classList.remove("hidden");
  }
}

function renderNamingBonus() {
  state.namingClaimed = false;
  state.namingPenalized = new Set();
  const wrap = $("naming-buttons");
  wrap.innerHTML = "";

  state.players.forEach((p, i) => {
    const row = document.createElement("div");
    row.className = "naming-row";
    row.dataset.i = i;
    const label = document.createElement("span");
    label.className = "naming-name";
    label.textContent = p.name;

    const plus = document.createElement("button");
    plus.className = "ghost mini-award";
    plus.textContent = "named it ✅ +🪙";
    plus.onclick = () => awardNamingToken(i);

    const minus = document.createElement("button");
    minus.className = "ghost mini-penalty";
    minus.textContent = "wrong ❌ −🪙";
    minus.onclick = () => penalizeNamingToken(i);

    row.append(label, plus, minus);
    wrap.appendChild(row);
  });

  $("naming-text").textContent =
    "🎤 Title & artist: award a 🪙 to whoever named it (active player first, else a challenger). " +
    "A challenger who guessed the name and got it wrong loses a 🪙.";
  updateNamingButtons();
  $("naming-bonus").classList.remove("hidden");
}

function updateNamingButtons() {
  $("naming-buttons").querySelectorAll(".naming-row").forEach((row) => {
    const i = +row.dataset.i;
    const p = state.players[i];
    row.querySelector(".mini-award").disabled = state.namingClaimed || p.tokens >= state.maxTokens;
    row.querySelector(".mini-penalty").disabled = p.tokens <= 0 || state.namingPenalized.has(i);
  });
}

function awardNamingToken(i) {
  if (state.namingClaimed) return;
  const p = state.players[i];
  if (p.tokens >= state.maxTokens) return;
  p.tokens = Math.min(state.maxTokens, p.tokens + 1);
  state.namingClaimed = true; // only one correct namer per song
  renderScoreboard("scoreboard");
  updateNamingButtons();
  toast(`${p.name} earned a 🪙 for naming the tune!`);
}

function penalizeNamingToken(i) {
  const p = state.players[i];
  if (p.tokens <= 0 || state.namingPenalized.has(i)) return;
  p.tokens -= 1;
  state.namingPenalized.add(i);
  renderScoreboard("scoreboard");
  updateNamingButtons();
  toast(`${p.name} lost a 🪙 — wrong name challenge.`);
}

function nextTurn() {
  state.awaitingNext = false;
  state.turn = (state.turn + 1) % state.players.length;
  if (state.deck.length === 0) {
    toast("Out of songs — highest card count wins!");
    endGame([...state.players].sort((a, b) => b.timeline.length - a.timeline.length)[0]);
    return;
  }
  renderGame();
}

function endGame(winner) {
  $("winner-name").textContent = winner.name;
  const sb = $("final-scoreboard");
  sb.innerHTML = "";
  [...state.players]
    .sort((a, b) => b.timeline.length - a.timeline.length)
    .forEach((p) => {
      const chip = document.createElement("div");
      chip.className = "score-chip" + (p === winner ? " active" : "");
      chip.innerHTML = `${p.name}<span class="pts">${p.timeline.length}</span>`;
      sb.appendChild(chip);
    });
  pausePlayback();
  showScreen("win-screen");
}

function exitGame() {
  if (!confirm("Exit the current game and return to setup?")) return;
  pausePlayback();
  state.current = null;
  state.awaitingNext = false;
  state.deck = [];
  state.players = [];
  showScreen("setup-screen");
  refreshStartButton();
}

/* ====================================================================
   SETUP UI
   ==================================================================== */
function addPlayerRow(name = "") {
  const list = $("player-list");
  const row = document.createElement("div");
  row.className = "player-row";
  row.innerHTML = `
    <input type="text" placeholder="Player name" value="${escapeHtml(name)}" />
    <button class="remove" type="button">✕</button>`;
  row.querySelector(".remove").onclick = () => {
    row.remove();
    refreshStartButton();
  };
  row.querySelector("input").oninput = refreshStartButton;
  list.appendChild(row);
  refreshStartButton();
}

function getPlayerNames() {
  return Array.from($("player-list").querySelectorAll("input"))
    .map((i) => i.value.trim())
    .filter(Boolean);
}

function setBuiltin(on) {
  state.useBuiltin = on;
  $("builtin-btn").textContent = on
    ? "✓ Built-in deck selected — tap to use a playlist instead"
    : "🎵 Use built-in deck (no playlist needed)";
  $("builtin-btn").classList.toggle("primary", on);
  $("builtin-btn").classList.toggle("ghost", !on);
  $("playlist-input").disabled = on;
  if (on) $("playlist-input").value = "";
  $("reshuffle-btn").classList.toggle("hidden", !on);
  updateShoeInfo();
  refreshStartButton();
}

function refreshStartButton() {
  const names = getPlayerNames();
  const connected = !!state.token;
  const device = !!state.deviceId;
  const haveMusic = state.useBuiltin || $("playlist-input").value.trim().length > 0;
  const ok = connected && device && names.length >= 1 && haveMusic;
  $("start-btn").disabled = !ok;

  const hint = [];
  if (!connected) hint.push("connect Spotify");
  else if (!device) hint.push("choose a playback device");
  if (!haveMusic) hint.push("add a playlist or pick the built-in deck");
  if (names.length < 1) hint.push("add at least one player");
  $("setup-hint").textContent = hint.length ? "Still need to: " + hint.join(", ") + "." : "";
}

/* Populate the playback-device dropdowns (setup + in-game). */
async function refreshDevices() {
  try {
    const devices = await listDevices();
    const opts = [];
    if (state.sdkDeviceId) {
      opts.push({ id: state.sdkDeviceId, label: "This browser (Hitster) — desktop only" });
    }
    for (const d of devices) {
      if (d.id === state.sdkDeviceId) continue; // avoid duplicate
      opts.push({ id: d.id, label: `${d.name} (${d.type})${d.is_active ? " • active" : ""}` });
    }

    const previous = state.deviceId;
    if (opts.length === 0) {
      state.deviceId = null;
    } else {
      // keep previous choice, else prefer an active Connect device, else SDK/first
      const active = devices.find((d) => d.is_active);
      state.deviceId =
        (previous && opts.some((o) => o.id === previous) && previous) ||
        (active && active.id) ||
        opts[0].id;
    }
    populateDeviceSelects(opts);
  } catch (e) {
    toast("Couldn't list devices: " + e.message);
  }
  refreshStartButton();
}

function populateDeviceSelects(opts) {
  for (const id of ["device-select", "game-device-select"]) {
    const select = $(id);
    if (!select) continue;
    select.innerHTML = "";
    if (!opts.length) {
      select.innerHTML =
        '<option value="">No devices — open Spotify, play a song, then ↻</option>';
      continue;
    }
    for (const o of opts) {
      const el = document.createElement("option");
      el.value = o.id;
      el.textContent = o.label;
      select.appendChild(el);
    }
    if (state.deviceId) select.value = state.deviceId;
  }
}

/* Find a usable device again after one goes idle/missing. Returns true if set. */
async function recoverDevice() {
  try {
    const devices = await listDevices();
    if (state.deviceId && devices.some((d) => d.id === state.deviceId)) return true;
    const active = devices.find((d) => d.is_active);
    const opts = [];
    if (state.sdkDeviceId) opts.push({ id: state.sdkDeviceId });
    devices.forEach((d) => d.id !== state.sdkDeviceId && opts.push({ id: d.id }));
    state.deviceId = (active && active.id) || (devices[0] && devices[0].id) || state.sdkDeviceId || null;
    await refreshDevices();
    return !!state.deviceId;
  } catch (_) {
    return false;
  }
}

async function onStart() {
  const names = getPlayerNames();
  state.players = names.map((n) => ({ name: n, timeline: [], tokens: 0 }));
  state.targetCards = Math.max(3, parseInt($("target-cards").value, 10) || 10);
  state.startTokens = Math.max(0, parseInt($("start-tokens").value, 10) || 0);
  state.maxTokens = Math.max(1, parseInt($("max-tokens").value, 10) || 1);
  state.startTokens = Math.min(state.startTokens, state.maxTokens);

  $("start-btn").disabled = true;
  $("start-btn").textContent = "Loading songs…";
  try {
    if (state.useBuiltin) {
      // draw from the persistent shoe; refill only when it's nearly empty, so
      // songs don't repeat across games until the whole deck is used up
      if (!Array.isArray(state.shoe) || state.shoe.length < state.players.length + 2) {
        state.shoe = builtinDeck();
      }
      state.deck = state.shoe; // same reference — drawing persists across games
      saveShoe();
    } else {
      state.deck = await loadDeck($("playlist-input").value);
      localStorage.setItem(LS.playlist, $("playlist-input").value.trim());
    }
    if (state.deck.length < state.players.length + 2) {
      throw new Error("Not enough songs for that many players.");
    }
    startGame();
  } catch (e) {
    toast(e.message, 4000);
  } finally {
    $("start-btn").textContent = "Start game";
    refreshStartButton();
  }
}

/* ====================================================================
   CONNECT FLOW
   ==================================================================== */
async function finishConnect() {
  setStatus("Connecting…", "connecting");
  try {
    const me = await api("/me");
    if (me.product !== "premium") {
      setStatus("Premium required", "disconnected");
      toast("This account isn't Premium. Spotify only allows app-controlled playback for Premium users.", 6000);
      return;
    }
  } catch (e) {
    setStatus("Connection failed", "disconnected");
    toast(e.message, 5000);
    return;
  }

  setStatus("Connected ✓", "connected");
  $("connect-btn").textContent = "Connected ✓";
  $("connect-btn").disabled = true;
  $("connect-btn").classList.add("hidden");
  $("disconnect-btn").classList.remove("hidden");
  $("device-section").classList.remove("hidden");

  // The in-browser SDK player only works on desktop browsers. Try it, but
  // don't block — phones use Spotify Connect (their own Spotify app) instead.
  initPlayer()
    .then(() => refreshDevices())
    .catch(() => refreshDevices());

  // also list Connect devices straight away (phones, other computers, etc.)
  refreshDevices();
}

function disconnectSpotify() {
  if (!confirm("Disconnect from Spotify?")) return;
  pausePlayback();
  if (state.player) {
    try { state.player.disconnect(); } catch (_) {}
  }
  clearTimeout(state.refreshTimer);
  state.token = null;
  state.tokenExpiry = 0;
  state.refreshToken = null;
  state.player = null;
  state.sdkDeviceId = null;
  state.deviceId = null;
  localStorage.removeItem(LS.token);
  localStorage.removeItem(LS.refresh);
  localStorage.removeItem(LS.scopeV);

  setStatus("Not connected", "disconnected");
  $("connect-btn").textContent = "Connect to Spotify";
  $("connect-btn").disabled = false;
  $("connect-btn").classList.remove("hidden");
  $("disconnect-btn").classList.add("hidden");
  $("device-section").classList.add("hidden");
  $("device-select").innerHTML = "";
  refreshStartButton();
}

async function handleRedirect() {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  const error = params.get("error");
  if (error) {
    toast("Spotify authorization was cancelled.");
    history.replaceState({}, document.title, REDIRECT_URI);
    return;
  }
  if (code) {
    try {
      const data = await exchangeToken(code);
      storeToken(data);
    } catch (e) {
      toast(e.message, 5000);
    }
    history.replaceState({}, document.title, REDIRECT_URI);
  }
}

/* ====================================================================
   BOOT
   ==================================================================== */
async function boot() {
  $("redirect-uri-display").textContent = REDIRECT_URI;

  // restore saved fields
  $("client-id").value = localStorage.getItem(LS.clientId) || DEFAULT_CLIENT_ID;
  $("playlist-input").value = localStorage.getItem(LS.playlist) || DEFAULT_PLAYLIST;
  loadShoe();

  // wire setup events
  $("help-toggle").onclick = (e) => {
    e.preventDefault();
    $("help-box").classList.toggle("hidden");
  };
  $("copy-redirect").onclick = () => {
    navigator.clipboard.writeText(REDIRECT_URI);
    toast("Redirect URI copied.");
  };
  $("connect-btn").onclick = beginLogin;
  $("disconnect-btn").onclick = disconnectSpotify;
  $("exit-game-btn").onclick = exitGame;
  $("refresh-devices").onclick = refreshDevices;
  $("device-select").onchange = (e) => {
    state.deviceId = e.target.value || null;
    refreshStartButton();
  };
  // in-game device recovery
  $("game-device-btn").onclick = () => {
    $("game-device-bar").classList.toggle("hidden");
    refreshDevices();
  };
  $("game-refresh-devices").onclick = () => { refreshDevices(); toast("Devices refreshed."); };
  $("game-device-select").onchange = (e) => {
    state.deviceId = e.target.value || null;
    toast("Playback device set. Press Play again if needed.");
  };
  $("add-player").onclick = () => addPlayerRow();
  $("playlist-input").oninput = () => {
    if ($("playlist-input").value.trim()) setBuiltin(false);
    refreshStartButton();
  };
  $("builtin-btn").onclick = () => setBuiltin(!state.useBuiltin);
  $("reshuffle-btn").onclick = reshuffleShoe;
  $("start-btn").onclick = onStart;

  // game events
  $("play-btn").onclick = onPlay;
  $("pause-btn").onclick = async () => {
    await pausePlayback();
    $("play-btn").disabled = false;
    $("pause-btn").disabled = true;
  };
  $("replay-btn").onclick = async () => {
    if (state.current) await playTrack(state.current.uri);
  };
  $("reveal-btn").onclick = resolveTurn;
  $("next-turn-btn").onclick = nextTurn;
  $("play-again-btn").onclick = () => window.location.reload();

  // default two players
  addPlayerRow("Player 1");
  addPlayerRow("Player 2");

  // OAuth: handle the redirect code, else restore a saved token
  await handleRedirect();
  if (!state.token) loadStoredToken();

  // access token expired but we have a refresh token → renew silently
  if (!state.token && (state.refreshToken || localStorage.getItem(LS.refresh))) {
    if (localStorage.getItem(LS.scopeV) === SCOPE_VERSION) {
      state.refreshToken = state.refreshToken || localStorage.getItem(LS.refresh);
      try { await refreshAccessToken(); } catch (_) {}
    }
  }

  if (state.token) {
    await finishConnect();
  } else {
    setStatus("Not connected", "disconnected");
  }
}

boot();
