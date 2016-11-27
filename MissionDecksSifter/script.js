
var Factions = {
	FC_CORPUS: "Corpus",
	FC_GRINEER: "Grineer",
	FC_INFESTATION: "Infestation",
	FC_OROKIN: "Orokin",
};
function Faction( s ) { return Factions[ s ] || s; }

var MissionTypes = {};
MissionTypes[ "MT_EXTERMINATION" ] = [ "Exterminate", 0 ];
MissionTypes[ "MT_SURVIVAL" ] = [ "Survival", 1 ];
MissionTypes[ "MT_RESCUE" ] = [ "Rescue", 2 ];
MissionTypes[ "MT_SABOTAGE" ] = [ "Sabotage", 3 ];
MissionTypes[ "MT_INTEL" ] = [ "Spy", 4 ];
MissionTypes[ "MT_DEFENSE" ] = [ "Defense", 5 ];
MissionTypes[ "MT_MOBILE_DEFENSE" ] = [ "Mobile Defense", 6 ];
MissionTypes[ "MT_TERRITORY" ] = [ "Interception", 7 ];
MissionTypes[ "MT_RETRIEVAL" ] = [ "Hijack", 8 ];
MissionTypes[ "MT_ASSASSINATION" ] = [ "Assassination", 9 ];
MissionTypes[ "MT_CAPTURE" ] = [ "Capture", -1 ];
MissionTypes[ "MT_HIVE" ] = [ "Hive", -1 ];
MissionTypes[ "MT_COUNTER_INTEL" ] = [ "Deception", -1 ];
MissionTypes[ "MT_EXCAVATE" ] = [ "Excavation", -1 ];
MissionTypes[ "MT_Race" ] = [ "Race", -1 ];
MissionTypes[ "MT_PURSUIT" ] = [ "Pursuit", -1 ];
MissionTypes[ "MT_ARENA" ] = [ "Arena", -1 ];
MissionTypes[ "MT_RACE" ] = [ "Archwing Rush", -1 ];
MissionTypes[ "MT_PVP" ] = [ "Conclave", -1 ];
function MissionType( s ) {
	if ( MissionTypes[ s ] ) return MissionTypes[ s ][ 0 ];
	console.log( "Unknown Mission Type: " + s )
	return s
}

var NodeTypes = {
	NT_CLAN: "Dark Sector",
	NT_MISSION: "Mission",
	NT_EVENT: "Event",
	NT_PVP: "Mission", // "Conclave Mission"
};
function NodeType( s ) {
	if ( NodeTypes[ s ] ) return NodeTypes[ s ];
	console.log( "Unknown Node Type: " + s )
	return s
}

function StartDataLoad() {
	var xhr = new XMLHttpRequest();
	xhr.open( "get", "https://raw.githubusercontent.com/VoiDGlitch/WarframeData/master/JSON/MissionDecks.json", true );
	//xhr.open( "get", "https://raw.githubusercontent.com/VoiDGlitch/WarframeData/master/MissionDecks.txt", true );
	xhr.responseType = 'json';
	xhr.onload = function() {
		var status = xhr.status;
		if ( status == 200 ) {
			OnDataLoaded( xhr.response );
		} else {
			console.log( "Error:" + status );
		}
	};
	xhr.onerror = function() {
		console.log( "XMLHttpRequest Error!" );
	}
	xhr.send();
}
StartDataLoad()

var JSONDataSet = {};
var DataSets = {};
var PlanetDataSets = {};
var NodeDataSets = {};
var ItemDataSets = {};
var RelicDataSets = {};
var PrimeDataSets = {}
function OnDataLoaded( data ) {
	console.log( data )

	JSONDataSet = data;

	for ( var dropTable in data ) {
		var t = data[ dropTable ];

		if ( t.Locations && ( typeof t.Locations[ 0 ] !== "object" ) ) {
			for ( locationID in t.Locations ) {
				var locStr = t.Locations[ locationID ];
				if ( locStr.toLowerCase().endsWith( "relic" ) ) {
					for ( var itemID in t[ "Rotation A" ] ) { // Danger Zone. If this changes, we are screwed
						var line = t[ "Rotation A" ][ itemID ];

						var item = ParseRelicItemLine( line );
						item.Relic = t.Locations[ 0 ];
						if ( !PrimeDataSets[ item.Item ] ) PrimeDataSets[ item.Item ] = [];
						PrimeDataSets[ item.Item ].push( item );

						if ( !RelicDataSets[ item.Relic ] ) RelicDataSets[ item.Relic ] = { Locations: [] };
						RelicDataSets[ item.Relic ].DropTable = dropTable;
					}
					continue;
				}

				var loc = ParseLocation( locStr );

				NodeDataSets[ loc.Node ] = {
					Planet: loc.Planet,
					MissionType: loc.MissionTypeNice,
					Faction: loc.FactionNice,
					NodeType: loc.NodeTypeNice,
					DropTable: dropTable
				};

				if ( !PlanetDataSets[ loc.Planet ] ) PlanetDataSets[ loc.Planet ] = {};
				if ( !PlanetDataSets[ loc.Planet ][ loc.Node ] ) PlanetDataSets[ loc.Planet ][ loc.Node ] = []
				PlanetDataSets[ loc.Planet ][ loc.Node ].push( dropTable );
			}

			if ( t.Locations[ 0 ].toLowerCase().endsWith( "relic" ) ) continue;
		}

		var itemsInTable = ParseRotations( t );
		if ( itemsInTable.length > 0 ) {
			for ( itemID in itemsInTable ) {
				var item = itemsInTable[ itemID ];
				item.DropTable = dropTable;

				if ( item.Item && item.Item.toLowerCase().endsWith( "relic" ) ) {
					if ( !RelicDataSets[ item.Item ] ) RelicDataSets[ item.Item ] = { Locations: [] };
					
					if ( t.Locations && ( typeof t.Locations[ 0 ] !== "object" ) ) {
						for ( locationID in t.Locations ) {
							var loc = ParseLocation( t.Locations[ locationID ] );
							RelicDataSets[ item.Item ].Locations.push( {
								Planet: loc.Planet,
								Node: loc.Node,
								Faction: loc.FactionNice,
								MissionType: loc.MissionTypeNice,
								NodeType: loc.NodeTypeNice,
								Rarity: item.Rarity,
								Chance: item.Chance,
								Rotation: item.Rotation
							} );
						}
					}
					continue;
				}

				if ( !ItemDataSets[ item.Item ] ) ItemDataSets[ item.Item ] = [];
				ItemDataSets[ item.Item ].push( item );
			}
		}
	}

	console.log( DataSets );
	console.log( PlanetDataSets );
	console.log( NodeDataSets );
	console.log( ItemDataSets );
	console.log( RelicDataSets );
	console.log( PrimeDataSets );

	// Caused problems when entering stuff rapidly / going back and forth rapidly
	//document.getElementById( "searchbar" ).addEventListener( "keydown", function( e ) { SearchMeUp( e ) } );

	LoadGetValues();
}

function LoadGetValues( b ) {
	var GET = window.location.search.substr( 1 );
	if ( GET && GET.length > 0 ) {
		OpenInSearch( unescape( GET ), b );
	} else if ( b ) {
		OpenInSearch( "", true );
	}
}

function SearchMeUp( e ) {
	//console.log( e, e.target, event )
	//var bleh = event.target
	setTimeout( function() {
		DoSearch( document.getElementById( "searchbar" ).value.toLowerCase() );
	}, 200 )
}

function OpenInSearch( txt, nopush ) {
	if ( event && event.which == 2 ) return; // Allow middle mouse clicks to open new tabs
	document.getElementById( "searchbar" ).value = txt.innerHTML || txt;
	DoSearch()
	event.stopPropagation();
	if ( !nopush ) window.history.pushState( null, null, "?" + document.getElementById( "searchbar" ).value );
	return false;
}

function SearchHeader( t ) {
	return "<div class='card'><div class='header'>" + t + "</div><div class='body'>";
}

function CreateCard( data ) {
	return "<div class='card'><div class='header'>" + data.header + "</div><div class='body'>" + data.body + "</div></div>";
}

function CreateSearchLink( txt ) {
	return "<a href='?" + txt + "' onclick='return OpenInSearch( this )'>" + txt + "</a>"
}
function CreateWikiLink( txt ) {
	return "<a href='http://warframe.wikia.com/wiki/" + txt + "'>Wiki</a>"
}

function ParseItem( str ) {
	var start = str.indexOf( " " );
	var itemName = str.substr( start + 1 );
	var count = parseInt( str.substr( 0, start ) );

	if ( itemName.toLowerCase().endsWith( "endo" ) ) {
		var start2 = itemName.toLowerCase().indexOf( " endo" );
		var endoCount = parseInt( itemName.substr( 0, start2 ) );
		count *= endoCount

		itemName = itemName.substr( start2 + 1 )
	}

	return {
		Item: itemName,
		Count: count
	}
}

function ParseItemLine( str ) {
	var t = str.split( ", " );
	if ( t.length == 1 ) return {};

	var item = ParseItem( t[ 0 ] )

	if ( t.length == 2 ) {
		t[ 2 ] = t[ 1 ];
		t[ 1 ] = "???";
	}

	if ( t.length == 6 || t.length == 7 ) {
		return ParseRelicItemLine( str );
	}

	return {
		Item: item.Item,
		Count: item.Count,
		Rarity: t[ 1 ],
		Chance: parseFloat( t[ 2 ] )
	}
}

function ParseRelicItemLine( str ) {
	var t = str.split( ", " );

	var item = ParseItem( t[ 0 ] )
	var startD = t[ 6 ] ? t[ 6 ].indexOf( " " ) : -1;

	return {
		Item: item.Item,
		Count: item.Count,
		Rarity: t[ 1 ],
		Intact: parseFloat( t[ 2 ].substr( 2 ) ),
		Excellect: parseFloat( t[ 3 ].substr( 2 ) ),
		Flawless: parseFloat( t[ 4 ].substr( 2 ) ),
		Radiant: parseFloat( t[ 5 ].substr( 2 ) ),
		Ducats: t[ 6 ] ? parseFloat( t[ 6 ].substr( 0, startD ) ) : -1,
	}
}

function ParseLocation( str ) {
	var t = str.split( ", " );
	return {
		Planet: t[ 0 ],
		Node: t[ 1 ],
		MissionType: t[ 2 ],
		MissionTypeNice: MissionType( t[ 2 ] ),
		Faction: t[ 3 ],
		FactionNice: Faction( t[ 3 ] ),
		NodeType: t[ 4 ],
		NodeTypeNice: NodeType( t[ 4 ] )
	}
}

function ParseRotations( val ) {
	var Rotations = [];
	for ( keyName in val ) {
		if ( keyName.toLowerCase().startsWith( "rotation" ) ) {
			for ( itemID in val[ keyName ] ) {
				var itemStr = val[ keyName ][ itemID ]
				if ( itemStr.startsWith( "1 \"\"" ) ) continue;
				if ( itemStr.startsWith( "FixedWeigths=True" ) ) continue;
				var item = ParseItemLine( itemStr );
				if ( !item.Item ) continue;
				item.Rotation = keyName;
				Rotations.push( item );
			}
		}
	}
	return Rotations;
}

function Item( item, count ) {
	if ( !count || count < 2 ) return CreateSearchLink( item )
	return count + " " + CreateSearchLink( item )
}

function DoSearch( txt ) {
	txt = txt || document.getElementById( "searchbar" ).value.toLowerCase();

	var res = "";
	if ( txt.trim() == "" ) {
		document.getElementById( "results_default" ).style.display = "block";
		document.getElementById( "results" ).innerHTML = "";
		return
	}
	document.getElementById( "results_default" ).style.display = "none";

	var items = [];
	for ( key in PlanetDataSets ) {
		var val = PlanetDataSets[ key ];

		if ( key.toLowerCase() == txt ) {
			var nodes = [];
			for ( k in val ) {
				nodes.push( CreateSearchLink( k ) )
			}
			res += CreateCard( { header: "Planet", body: "<div class='item'>" + CreateSearchLink( key ) + "<br/><br/>Nodes:<br/>" + nodes.join( ", " )  + "</div>" } );
			break;
		}

		if ( key.toLowerCase().indexOf( txt ) < 0 ) continue;
		items.push( "<div class='item'>" + CreateSearchLink( key ) + "</div>" );
	}
	if ( items.length > 0 ) res += CreateCard( { header: "Planet Matches", body: items.join( "" ) } );

	var items = [];
	for ( key in NodeDataSets ) {
		var val = NodeDataSets[ key ];

		if ( key.toLowerCase() == txt ) {
			var drops = "";
			var dropItems = ParseRotations( JSONDataSet[ val.DropTable ] );

			if ( dropItems.length < 1 ) {
				drops = "<div class='item'>None</div>";
			} else {
				// Should do rotation grouping!
				for ( var i = 0; i < dropItems.length; i++ ) {
					var item = dropItems[ i ]
					drops += "<div class='row'><div class='cell'>" + ( ( item.Count > 1 ) ? ( item.Count + " " ) : "") + CreateSearchLink( item.Item ) +
					"</div><div class='cell'>" + item.Rarity + "</div><div class='cell'>" + item.Chance + "%</div><div class='cell'>" + item.Rotation +
					"</div></div>";
				}
			}

			res += CreateCard( { header: "Node", body: "<div class='item'>" + CreateSearchLink( key ) +
			"<br/><br/>Planet: " + CreateSearchLink( val.Planet ) +
			"<br/>Faction: " + CreateSearchLink( val.Faction ) +
			"<br/>Mission Type: " + CreateSearchLink( val.MissionType ) +
			"<br/>Node Type: " + CreateSearchLink( val.NodeType ) +
			"<br/><br/>Drops:</div><div class='table'>" + drops +
			"</div>"  } );
			break;
		}

		if ( key.toLowerCase().indexOf( txt ) < 0 && val.Planet.toLowerCase().indexOf( txt ) < 0 && val.Faction.toLowerCase().indexOf( txt ) < 0 && val.MissionType.toLowerCase().indexOf( txt ) < 0 && val.NodeType.toLowerCase().indexOf( txt ) < 0 ) continue;
		items.push( "<div class='row'><div class='cell'>" + CreateSearchLink( key ) + "</div><div class='cell'>" + CreateSearchLink( val.Planet ) + "</div><div class='cell'>" + val.Faction + "</div><div class='cell'>" + val.MissionType + "</div><div class='cell'>" + val.NodeType + "</div></div>" );
	}
	if ( items.length > 0 ) res += CreateCard( { header: "Node Matches", body: "<div class='table'>" + items.join( "" ) + "</div>" } );

	var items = [];
	for ( key in ItemDataSets ) {
		var val = ItemDataSets[ key ];

		if ( key.toLowerCase() == txt ) {
			var drops = "";

			if ( val.length < 1 ) {
				drops = "<div class='item'>Unknown?</div>";
			} else {
				// Should do proper table formatting and rotation grouping!
				for ( var i = 0; i < val.length; i++ ) {
					var item = val[ i ];
					var missions = JSONDataSet[ item.DropTable ].Locations;
					if ( !missions ) continue;

					for ( var j = 0; j < missions.length; j++ ) { // This is probably wrong and will be wrong when the same item is two times in 1 drop table
						var misVal = ParseLocation( missions[ j ] );
						drops += "<div class='row'><div class='cell'>" + ( ( item.Count > 1 ) ? ( "( " + item.Count + "x ) " ) : "" ) + CreateSearchLink( misVal.Node ) + ", " + CreateSearchLink( misVal.Planet ) + "</div><div class='cell'>" + misVal.FactionNice + "</div><div class='cell'>" +
						misVal.MissionTypeNice + "</div><div class='cell'>" + misVal.NodeTypeNice +
						"</div><div class='cell'>" + item.Rarity + "</div><div class='cell'>" + item.Chance + "%</div><div class='cell'>" + item.Rotation +
						"</div></div>";
					}
				}

				// The drop tables for this item are not from any nodes!
				if ( drops == "" ) {
					for ( var i = 0; i < val.length; i++ ) {
						var item = val[ i ];
						drops += "<div class='row'><div class='cell'>" + ( ( item.Count > 1 ) ? ( "( " + item.Count + "x ) " ) : "" ) + CreateSearchLink( item.DropTable ) +
						"</div><div class='cell'>" + item.Rarity + "</div><div class='cell'>" + item.Chance + "%</div><div class='cell'>" + item.Rotation +
						"</div></div>";
					}
				}
			}

			res += CreateCard( { header: "Item", body: "<div class='item'>" + CreateSearchLink( key ) + "<br/><br/>Drops On:</div><div class='table'>" + drops + "</div>" } );
			continue;//break;
		}

		if ( key.toLowerCase().indexOf( txt ) < 0 ) continue;
		items.push( "<div class='item'>" + CreateSearchLink( key ) + "</div>" );
	}
	if ( items.length > 0 ) res += CreateCard( { header: "Item Matches", body: items.join( "" ) } );

	var items = [];
	for ( key in RelicDataSets ) {
		var val = RelicDataSets[ key ];

		if ( key.toLowerCase() == txt ) {
			var drops = "";
			var contents = "";

			if ( val.Locations.length < 1 ) {
				drops = "<div class='item'>Unknown ( Vaulted )</div>";
			} else {
				//var dropsTable = [];

				/*// Should do proper table formatting and rotation grouping!
				for ( var i = 0; i < val.DropTables.length; i++ ) {
					var missions = JSONDataSet[ val.DropTables[ i ][ 4 ] ].Locations;

					var item = ParseItem( val.DropTables[ i ][ 0 ] )
					for ( var j = 0; j < missions.length; j++ ) {
						var misVal = missions[ j ];

						dropsTable.push( {
							Planet: misVal[ 0 ],
							Node: misVal[ 1 ],
							Faction: misVal[ 3 ],
							MissionType: misVal[ 2 ],
							NodeType: misVal[ 4 ],
							Count: item.Count,
							Rarity: val.DropTables[ i ][ 1 ],
							Chance: parseFloat( val.DropTables[ i ][ 2 ] ),
							Rotation: val.DropTables[ i ][ 3 ],
						} )
					}
				}

				dropsTable.sort( function( a, b ) { return b.Chance - a.Chance } );
				for ( var i = 0; i < dropsTable.length; i++ ) {
					var drop = dropsTable[ i ];
					drops += "<div class='row'><div class='cell'>" + CreateSearchLink( drop.Node ) + ", " + CreateSearchLink( drop.Planet ) + "</div><div class='cell'>" + Faction( drop.Faction ) + "</div><div class='cell'>" +
						MissionType( drop.MissionType ) + "</div><div class='cell'>" + NodeType( drop.NodeType ) + //( ( drop.Count > 1 ) ? ( "</div><div class='cell'>" + drop.Count + "x" ) : "" ) +
						"</div><div class='cell'>" + drop.Rarity + "</div><div class='cell'>" + drop.Chance + "%</div><div class='cell'>Rotation " + drop.Rotation +
						"</div></div>";
				}*/
				
				val.Locations.sort( function( a, b ) { return b.Chance - a.Chance } );
				for ( var i = 0; i < val.Locations.length; i++ ) {
					var drop = val.Locations[ i ];
					drops += "<div class='row'><div class='cell'>" + CreateSearchLink( drop.Node ) + ", " + CreateSearchLink( drop.Planet ) + "</div><div class='cell'>" + Faction( drop.Faction ) + "</div><div class='cell'>" +
						MissionType( drop.MissionType ) + "</div><div class='cell'>" + NodeType( drop.NodeType ) + //( ( drop.Count > 1 ) ? ( "</div><div class='cell'>" + drop.Count + "x" ) : "" ) +
						"</div><div class='cell'>" + drop.Rarity + "</div><div class='cell'>" + drop.Chance + "%</div><div class='cell'>" + drop.Rotation +
						"</div></div>";
				}
			}

			var primes = ParseRotations( JSONDataSet[ val.DropTable ] );
			if ( primes.length < 1 ) {
				contents = "<div class='item'>Unknown?</div>";
			} else {
				var sortTable = {};
				sortTable[ "COMMON" ] = 0;
				sortTable[ "UNCOMMON" ] = 1;
				sortTable[ "RARE" ] = 2;
				primes.sort( function( a, b ) { return sortTable[ a.Rarity ] - sortTable[ b.Rarity ] } )

				// Should do rotation grouping!

				for ( var i = 0; i < primes.length; i++ ) {
					var drop = primes[ i ];

					contents += "<div class='row'><div class='cell'>" + Item( drop.Item, drop.Count ) + "</div><div class='cell'>" + drop.Rarity + "</div><div class='cell'>" + drop.Intact +
					"% (Intact)</div><div class='cell'>" + drop.Excellect + "% (Excellect)</div><div class='cell'>" + drop.Flawless + "% (Flawless)</div><div class='cell'>" + drop.Radiant + "% (Radiant)</div><div class='cell'>" + (drop.Ducats > 0 ? drop.Ducats + " Ducats" : "") + "</div></div>";
				}
			}

			res += CreateCard( { header: "Relic", body: "<div class='item'>" + CreateSearchLink( key ) + "<br/><br/>Contents:</div><div class='table'>" + contents + "</div><div class='item'><br/>Drops On:</div><div class='table'>" + drops + "</div>" } );
			continue;//break;
		}

		if ( key.toLowerCase().indexOf( txt ) < 0 ) continue;
		items.push( "<div class='item'>" + CreateSearchLink( key ) + "</div>" );
	}
	if ( items.length > 0 ) res += CreateCard( { header: "Relic Matches", body: items.join( "" ) } );

	var items = [];
	for ( key in PrimeDataSets ) {
		var val = PrimeDataSets[ key ];

		if ( key.toLowerCase() == txt ) {
			var drops = "";

			if ( val.length < 1 ) {
				drops = "<div class='item'>Unknown?</div>";
			} else {
				for ( var i = 0; i < val.length; i++ ) {
					var dropPlace = val[ i ];
					drops += "<div class='row'><div class='cell'>" + CreateSearchLink( dropPlace.Relic ) +
					"</div><div class='cell'>" + dropPlace.Rarity + "</div><div class='cell'>" + dropPlace.Intact + "% (Intact)</div><div class='cell'>" + dropPlace.Excellect + "% (Excellect)</div><div class='cell'>" + dropPlace.Flawless +
					"% (Flawless)</div><div class='cell'>" + dropPlace.Radiant + "% (Radiant)</div><div class='cell'>" + ( dropPlace.Ducats > 0 ? dropPlace.Ducats + " Ducats" : "" ) + "</div>" +
					"</div>";
				}
			}

			res += CreateCard( { header: "Prime Part", body: "<div class='item'>" + CreateSearchLink( key ) + "<br/><br/>Drops From:</div><div class='table'>" + drops + "</div>" } );
			continue;//break;
		}

		if ( key.toLowerCase().indexOf( txt ) < 0 ) continue;
		items.push( "<div class='item'>" + CreateSearchLink( key ) + "</div>" );
	}
	if ( items.length > 0 ) res += CreateCard( { header: "Prime Parts Matches", body: items.join( "" ) } );

	var items = [];
	for ( key in JSONDataSet ) { //for ( key in DataSets ) {
		var val = JSONDataSet[ key ]; //var val = DataSets[ key ];

		if ( key.toLowerCase() == txt ) {
			var str = "<div class='item'>" + CreateSearchLink( key ) + "<br/><br/>Used By:</div>";

			var missions = val.Locations;
			if ( !missions || missions.length < 1 ) {
				str += "<div class='item'>Unknown</div>";
			} else {
				str += "<div class='table'>";
				for ( missionID in missions ) {
					var mission = ParseLocation( missions[ missionID ] );
					if ( !mission.Node ) {
						str += "<div class='row'><div class='cell'>" + CreateSearchLink( mission.Planet ) + "</div></div>";
					} else {
						str += "<div class='row'><div class='cell'>" + CreateSearchLink( mission.Node ) + "</div><div class='cell'>" + CreateSearchLink( mission.Planet ) +
						"</div><div class='cell'>" + CreateSearchLink( mission.FactionNice ) + "</div><div class='cell'>" + CreateSearchLink( mission.MissionTypeNice ) + "</div><div class='cell'>" + CreateSearchLink( mission.NodeTypeNice ) +
						"</div></div>";
					}
				}
				str += "</div>";
			}

			str += "<div class='item'><br/>Drops:</div>";

			var rotations = ParseRotations( val );
			if ( rotations.length < 1 ) {
				str += "<div class='item'>Unknown</div>";
			} else {
				str += "<div class='table'>";
				for ( var i = 0; i < rotations.length; i++ ) {
					var item = rotations[ i ];
					if ( item.Chance ) {
						str += "<div class='row'><div class='cell'>" + Item( item.Item, item.Count ) + "</div><div class='cell'>" + item.Rarity +
						"</div><div class='cell'>" + item.Chance  + "%</div><div class='cell'>" + item.Rotation +
						"</div></div>";
					} else {
						str += "<div class='row'><div class='cell'>" + CreateSearchLink( item.Item ) +
						"</div><div class='cell'>" + item.Rarity + "</div><div class='cell'>" + item.Intact + "% (Intact)</div><div class='cell'>" + item.Excellect + "% (Excellect)</div><div class='cell'>" + item.Flawless +
						"% (Flawless)</div><div class='cell'>" + item.Radiant + "% (Radiant)</div><div class='cell'>" + ( item.Ducats > 0 ? item.Ducats + " Ducats" : "" ) + "</div>" +
						"</div>";
					}
				}
				str += "</div>";
			}

			res += CreateCard( { header: "Drop Table", body: str } );
			break;
		}

		if ( key.toLowerCase().indexOf( txt ) < 0 ) continue;
		items.push( "<div class='item'>" + CreateSearchLink( key ) + "</div>" );
	}
	if ( items.length > 0 ) res += CreateCard( { header: "Drop Table Matches", body: items.join( "" ) } );

	if ( res.trim() == "" ) {
		res = CreateCard( { header: "Failed", body: "<div class='item'>Found nothing!</div>" } );
	}

	document.getElementById( "results" ).innerHTML = res;
}

window.onpopstate = function( e ) {
	LoadGetValues( true );
};

//Backup
/*function OnDataLoaded( data ) {
	var CurrentDataSet = "";
	var CurrentRotation = "";

	var dataTable = data.split( "\n" );
	for ( var i = 0; i < dataTable.length; i++ ) {
		var line = dataTable[ i ]
		if ( line.trim() == "" ) continue;
		if ( line.startsWith( "  1 \"\"" ) ) continue; // Bug in data

		if ( line.startsWith( "[" ) ) {
			CurrentDataSet = line;
			DataSets[ CurrentDataSet ] = {};
			DataSets[ CurrentDataSet ].Locations = [];
			DataSets[ CurrentDataSet ].Items = [];
			CurrentRotation = "";
		} else if ( line.startsWith( "Stripped" ) ) {
			// Don't bother reading the value, it's always true
			DataSets[ CurrentDataSet ].Stripped = true;

		} else if ( line.startsWith( " - " ) && line.endsWith( "RELIC" ) ) {
			DataSets[ CurrentDataSet ].Relic = line.substr( 3 );

		} else if ( line.startsWith( " - " ) ) {
			var item = line.substr( 3 ).split( ", " );
			DataSets[ CurrentDataSet ].Locations.push( item );

			NodeDataSets[ item[ 1 ] ] = {
				Planet: item[ 0 ],
				MissionType: MissionType( item[ 2 ] ),
				Faction: Faction( item[ 3 ] ),
				NodeType: NodeType( item[ 4 ] ),
				DataSet: CurrentDataSet
			};

			if ( !PlanetDataSets[ item[ 0 ] ] ) PlanetDataSets[ item[ 0 ] ] = {};
			if ( !PlanetDataSets[ item[ 0 ] ][ item[ 1 ] ] ) PlanetDataSets[ item[ 0 ] ][ item[ 1 ] ] = []
			PlanetDataSets[ item[ 0 ] ][ item[ 1 ] ].push( CurrentDataSet );

		} else if ( line.startsWith( "Rotation" ) ) {
			CurrentRotation = line.substr( 9, 1 );
			// We are paring items and no missions were added!! GASP!
			if ( DataSets[ CurrentDataSet ].Locations.length < 1 ) {
				DataSets[ CurrentDataSet ].ItemSet = CurrentDataSet;
			}

		} else if ( line.endsWith( "Ducats" ) || ( line.endsWith( "%" ) && DataSets[ CurrentDataSet ].Relic ) ) {
			var item = line.substr( 2 ).split( ", " );
			DataSets[ CurrentDataSet ].Items.push( item );

			var currentRelicName = DataSets[ CurrentDataSet ].Relic
			if ( currentRelicName ) {
				if ( !RelicDataSets[ currentRelicName ] ) {
					RelicDataSets[ currentRelicName ] = {};
					RelicDataSets[ currentRelicName ].Drops = [];
					RelicDataSets[ currentRelicName ].Contents = [];
				}
				RelicDataSets[ currentRelicName ].Contents.push( item );

				var niceItem = ParseItem( item[ 0 ] );
				var startD = item[ 6 ] ? item[ 6 ].indexOf( " " ) : -1;
				if ( !PrimeDataSets[ niceItem.Item ] ) PrimeDataSets[ niceItem.Item ] = []
				PrimeDataSets[ niceItem.Item ].push( {
					Relic: currentRelicName,
					Count: niceItem.Count,
					Rarity: item[ 1 ],
					Intact: parseInt( item[ 2 ].substr( 2 ) ),
					Excellect: parseInt( item[ 3 ].substr( 2 ) ),
					Flawless: parseInt( item[ 4 ].substr( 2 ) ),
					Radiant: parseInt( item[ 5 ].substr( 2 ) ),
					Ducats: item[ 6 ] ? parseInt( item[ 6 ].substr( 0, startD ) ) : -1,
				} );
			} else {
				console.log( "MISSING currentRelicName" )
			}

		} else if ( line.endsWith( "%" ) ) {
			var item = line.substr( 2 ).split( ", " );
			if ( CurrentRotation == "" ) console.log( "bad CurrentRotation" );
			item.push( CurrentRotation );
			item.push( CurrentDataSet );

			DataSets[ CurrentDataSet ].Items.push( item );

			var itemName = item[ 0 ].substr( item[ 0 ].indexOf( " " ) + 1 );
			if ( itemName.toLowerCase().endsWith( "relic" ) ) {
				if ( itemName ) {
					if ( !RelicDataSets[ itemName ] ) {
						RelicDataSets[ itemName ] = {};
						RelicDataSets[ itemName ].Drops = [];
						RelicDataSets[ itemName ].Contents = [];
					}
					RelicDataSets[ itemName ].Drops.push( item );
				} else {
					console.log( "MISSING currentRelicName 2" )
				}
			} else {
				if ( !ItemDataSets[ itemName ] ) ItemDataSets[ itemName ] = [];
				ItemDataSets[ itemName ].push( item );
			}

		} else {
			console.log( "unhandled", line )
		}
	}

	console.log( DataSets );
	console.log( PlanetDataSets );
	console.log( NodeDataSets );
	console.log( ItemDataSets );
	console.log( RelicDataSets );
	console.log( PrimeDataSets );

	// Caused problems when entering stuff rapidly / going back and forth rapidly
	//document.getElementById( "searchbar" ).addEventListener( "keydown", function( e ) { SearchMeUp( e ) } );

	//LoadGetValues();
}*/