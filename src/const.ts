export const shipBaseSpeed = 0.1
export const planet_size = 0.2
export const cargoPerCargoBay = 5
//Note: if cargoPerDeliveryMission > cargoPerCargoBay,
// then how can we give a free cardo bay if a ship has zero?
export const cargoPerDeliveryMission = cargoPerCargoBay - 1
export const cargoPerCargoMission = 20
export const maxFreeCargoBays = 4
export const minDaysAfterIntercept = 2
export const shipNames = ["Beast of Burden", "Blade of Occam", "Lance of Centri", "Wasp", "Stophy's Venture", "Enterprise", "Sally Ride", "Stellar Explorer", "First Light", "Lance of Zhargi", "Adventurer of Bacia", "Astral Enterprise", "Star of Kali", "Isaur Gypsy", "Astral Pioneer", "Celestial Maiden", "Luna Moth", "Harrier", "Fralphua's Opportunity", "Tory's Venture", "Star of Kini", "Flame of Rasi", "Bolo", "Edwin Hubble", "Ycon Express", "Wren", "Spirit of Taly", "Illustrious", "Yukon", "Bara Traveler", "Horizon", "Star of Icon", "Lady of Ghera", "Celestial Jewel", "Youthful Indiscretion", "Gauntlet of Anic", "Shoole Trader", "Bake Clipper", "Jewel of Jocia", "Solar Constellation", "Uctim Clipper", "Castle of Syko", "Stellar Jewel", "Profit Margin", "Irregular of Taly", "Swallow", "Pathfinder", "Celestial Destiny", "Spirit of Inquiry"];
export const shipColors = ["2f4f4f", "556b2f", "8b4513", "8b0000", "808000", "483d8b", "5f9ea0", "008000", "3cb371", "4682b4", "d2691e", "9acd32", "cd5c5c", "00008b", "32cd32", "daa520", "8fbc8f", "800080", "b03060", "ff0000", "00ced1", "ff8c00", "ffd700", "ffff00", "0000cd", "deb887", "00ff00", "00fa9a", "8a2be2", "dc143c", "00bfff", "adff2f", "ff6347", "da70d6", "b0c4de", "ff00ff", "f0e68c", "6495ed", "dda0dd", "ff1493", "7b68ee", "ffa07a", "afeeee", "98fb98", "7fffd4", "fafad2", "ff69b4", "ffb6c1", "fff0f5"];
// TODO: store color2, too
// not all of these color names can be used to draw on canvas
// export const shipColors = ['black', 'darkslategray', 'darkolivegreen', 'saddlebrown', 'darkred', 'olive', 'darkslateblue', 'cadetblue', 'green', 'mediumseagreen', 'steelblue', 'chocolate', 'yellowgreen', 'indianred', 'darkblue', 'limegreen', 'goldenrod', 'darkseagreen', 'purple', 'maroon3', 'red', 'darkturquoise', 'darkorange', 'gold', 'yellow', 'mediumblue', 'burlywood', 'lime', 'mediumspringgreen', 'blueviolet', 'crimson', 'deepskyblue', 'greenyellow', 'tomato', 'orchid', 'lightsteelblue', 'fuchsia', 'khaki', 'cornflower', 'plum', 'deeppink', 'mediumslateblue', 'lightsalmon', 'paleturquoise', 'palegreen', 'aquamarine', 'lightgoldenrod', 'hotpink', 'lightpink', 'lavenderblush']
