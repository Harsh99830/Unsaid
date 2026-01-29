const adjectives = [
"Silent","Velvet","Frozen","Broken","Rusty","Ivory","Solar","Lunar","Neon","Misty",
"Hidden","Wild","Crimson","Golden","Faded","Dusky","Shady","Burning","Cosmic","Rapid",
"Electric","Hollow","Lost","Secret","Ancient","Gentle","Savage","Bright","Dark","Glowing",
"Silver","Scarlet","Emerald","Obsidian","Icy","Stormy","Dusty","Radiant","Soft","Sharp",
"Brave","Swift","Calm","Noisy","Lucky","Magic","Tiny","Giant","Cool","Hot",
"Deep","Shallow","Smooth","Rough","Quick","Slow","Bold","Fierce","Lazy","Crazy",
"Happy","Sad","Angry","Proud","Shy","Wise","Silly","Kind","Mean","Rare",
"Odd","Even","Prime","Major","Minor","Royal","Urban","Rural","Modern","Ancient",
"Future","Past","Hidden","Secret","Open","Closed","Clear","Blurred","Faint","Loud",
"Empty","Full","Heavy","Light","Strong","Weak","Tall","Short","Wide","Narrow",
"Fresh","Old","Young","New","Cold","Warm","Hot","Cool","Wet","Dry",
"Clean","Dirty","Sharp","Dull","Bright","Dim","Fast","Slow","Rich","Poor",
"Sweet","Bitter","Sour","Spicy","Soft","Hard","Smooth","Rough","Round","Flat",
"High","Low","Near","Far","Early","Late","First","Last","Next","Final",
"Alpha","Beta","Gamma","Delta","Omega","Super","Ultra","Mega","Micro","Mini",
"Smart","Dumb","Quick","Lazy","Brisk","Calm","Wild","Tame","Solid","Liquid",
"Broken","Fixed","Bent","Straight","Dark","Bright","Deep","Shallow","Fierce","Mild",
"Chill","Warm","Cool","Hot","Calm","Stormy","Windy","Rainy","Snowy","Sunny",
"Golden","Silver","Bronze","Iron","Steel","Crystal","Glass","Stone","Wooden","Paper",
"Plastic","Metal","Digital","Analog","Virtual","Real","Fake","True","Hidden","Visible"
];

const nouns = [
"Comet","Orbit","Tiger","Dune","Lantern","Pulse","Maple","Drift","Echo","Falcon",
"River","Shadow","Cloud","Forest","Storm","Flame","Stone","Wolf","Hawk","Leaf",
"Wave","Sky","Dust","Feather","Nova","Ash","Thunder","Frost","Rain","Star",
"Blade","Moon","Sun","Core","Spark","Mist","Field","Path","Light","Night",
"Shell","Wing","Root","Tree","Flower","Rock","Hill","Lake","Sea","Wind",
"Fire","Ice","Smoke","Sand","Snow","Rain","Storm","Breeze","Thunder","Lightning",
"Shadow","Light","Darkness","Dawn","Dusk","Midnight","Noon","Evening","Morning","Day",
"Night","Dream","Vision","Hope","Fear","Love","Hate","Peace","War","Mind",
"Soul","Heart","Brain","Blood","Bone","Skin","Voice","Sound","Noise","Whisper",
"Shout","Cry","Laugh","Smile","Tear","Echo","Signal","Code","Data","Pixel",
"Frame","Image","Photo","Video","Sound","Beat","Rhythm","Melody","Note","Tone",
"Chord","Song","Track","Game","Play","Move","Step","Jump","Run","Walk",
"Drive","Ride","Flight","Journey","Trip","Road","Trail","Bridge","Tunnel","Gate",
"Door","Wall","Roof","Floor","Room","House","City","Town","Village","Country",
"World","Planet","Earth","Mars","Venus","Space","Galaxy","Star","Moon","Sun",
"Atom","Cell","Energy","Force","Power","Speed","Time","Clock","Watch","Moment",
"Second","Minute","Hour","Year","Age","Era","History","Future","Past","Present",
"King","Queen","Knight","Soldier","Hero","Villain","Guard","Hunter","Rider","Pilot",
"Driver","Sailor","Captain","Chief","Boss","Master","Lord","Agent","Spy","Ninja",
"Robot","Drone","Machine","Engine","Motor","Wheel","Gear","Chain","Blade","Shield",
"Sword","Arrow","Gun","Cannon","Rocket","Missile","Bomb","Tank","Ship","Boat",
"Car","Truck","Bike","Plane","Jet","Rocket","Satellite","Station","Base","Camp"
];


function random(arr){
  return arr[Math.floor(Math.random()*arr.length)];
}

function randomNumber(){
  return Math.floor(Math.random()*900)+100;
}

export function generateUsername(){
  const adj = random(adjectives);
  const noun = random(nouns);
  const num = randomNumber();

  const patterns = [
    noun + num + adj,
    adj + num + noun,
    num + adj + noun,
    noun + adj + num,
    adj + noun + num,
    num + noun + adj
  ];

  return random(patterns);
}
