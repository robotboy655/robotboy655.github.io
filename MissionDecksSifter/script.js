
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
MissionTypes[ "MT_ARENA" ] = [ "Rathuum Area", -1 ];
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
	xhr.open( "get", "https://raw.githubusercontent.com/VoiDGlitch/WarframeData/master/MissionDecks.txt", true );
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

var DataSets = {};
var PlanetDataSets = {};
var NodeDataSets = {};
var ItemDataSets = {};
var RelicDataSets = {};
var PrimeDataSets = {}
function OnDataLoaded( data ) {
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
			DataSets[ CurrentDataSet ].Missions = [];
			DataSets[ CurrentDataSet ].Items = [];
			CurrentRotation = "";
		} else if ( line.startsWith( "Stripped" ) ) {
			// Don't bother reading the value, it's always true
			DataSets[ CurrentDataSet ].Stripped = true;

		} else if ( line.startsWith( " - " ) && line.endsWith( "RELIC" ) ) {
			DataSets[ CurrentDataSet ].Relic = line.substr( 3 );
	
		} else if ( line.startsWith( " - " ) ) {
			var item = line.substr( 3 ).split( ", " );
			DataSets[ CurrentDataSet ].Missions.push( item );

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
			if ( DataSets[ CurrentDataSet ].Missions.length < 1 ) {
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

	// Non hacky
	/*document.getElementById( "searchbar" ).addEventListener( "keydown", function( e ) {
		//
		SearchMeUp( e )
	} );*/

	LoadGetValues();
}

function LoadGetValues( b ) {
	var GET = window.location.search.substr( 1 );
	if ( GET && GET.length > 0 ) {
		OpenInSearch( unescape( GET ), b );
	}
}

function SearchMeUp( e ) {
	console.log( e, e.target, event )
	var bleh = event.target
	setTimeout( function() {
		DoSearch( bleh.value.toLowerCase() ); 
	}, 200 )
}

function OpenInSearch( txt, nopush ) {
	document.getElementById( "searchbar" ).value = txt.innerHTML || txt;
	DoSearch()
	event.stopPropagation();
	if ( !nopush ) window.history.pushState( null, null, "?" + document.getElementById( "searchbar" ).value );
	return false;
}

function SearchHeader( t ) {
	return "<div class='res'><div class='header'>" + t + "</div><div class='container'>";
}

function CreateCard( data ) {
	return "<div class='res'><div class='header'>" + data.header + "</div><div class='container'>" + data.body + "</div></div>";
}

function CreateSearchLink( txt ) {
	return "<a href='?" + txt + "' onclick='return OpenInSearch( this )'>" + txt + "</a>"
}

function ParseItem( str ) {
	var start = str.indexOf( " " );

	return {
		Item: str.substr( start + 1 ),
		Count: parseInt( str.substr( 0, start ) )
	}
}

function Item( item, count ) {
	if ( !count || count < 2 ) return item
	return count + " " + name
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
			res += CreateCard( { header: "Planet", body: "<div class='item' onclick='return ExpandPlanet( \"" + key + "\" )'>" + CreateSearchLink( key ) + "<br/><br/>Nodes:<br/>" + nodes.join( ", " )  + "</div>" } );
			break;
		}

		if ( key.toLowerCase().indexOf( txt ) < 0 ) continue;
		items.push( "<div class='item' onclick='return ExpandPlanet( \"" + key + "\" )'>" + CreateSearchLink( key ) + "</div>" );
	}
	if ( items.length > 0 ) res += CreateCard( { header: "Planet Matches", body: items.join( "" ) } );

	var items = [];
	for ( key in NodeDataSets ) {
		var val = NodeDataSets[ key ];

		if ( key.toLowerCase() == txt ) {
			var drops = "";
			var dropItems = DataSets[ val.DataSet ].Items

			if ( dropItems.length < 1 ) {
				drops = "<div class='item'>None</div>";
			} else {
				// Should do proper table formatting and rotation grouping!
				for ( var i = 0; i < dropItems.length; i++ ) {
					var item = ParseItem( dropItems[ i ][ 0 ] )
					drops += "<div class='item'>" + ( ( item.Count > 1 ) ? ( item.Count + "x " ) : "") + CreateSearchLink( item.Item ) + 
					" | " + dropItems[ i ][ 1 ] + " | " + dropItems[ i ][ 2 ] + " | Rotation " + dropItems[ i ][ 3 ] + 
					"</div>";
				}
			}
			
			res += CreateCard( { header: "Node", body: "<div class='item' onclick='return ExpandNode( \"" + key + "\" )'>" + CreateSearchLink( key ) + 
			"<br/><br/>Planet: " + CreateSearchLink( val.Planet ) + 
			"<br/>Faction: " + CreateSearchLink( val.Faction ) + 
			"<br/>Mission Type: " + CreateSearchLink( val.MissionType ) + 
			"<br/>Node Type: " + CreateSearchLink( val.NodeType ) + 
			"<br/><br/>Drops:" + drops +
			"</div>"  } );
			break;
		}

		if ( key.toLowerCase().indexOf( txt ) < 0 && val.Planet.toLowerCase().indexOf( txt ) < 0 && val.Faction.toLowerCase().indexOf( txt ) < 0 && val.MissionType.toLowerCase().indexOf( txt ) < 0 && val.NodeType.toLowerCase().indexOf( txt ) < 0 ) continue;
		items.push( "<div class='item'>" + CreateSearchLink( key ) +", " + CreateSearchLink( val.Planet ) + " - a " + val.Faction + " " + val.MissionType + " " + val.NodeType + "</div>" );
	}
	if ( items.length > 0 ) res += CreateCard( { header: "Node Matches", body: items.join( "" ) } );

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
					var missions = DataSets[ val[ i ][ 4 ] ].Missions;
					
					var item = ParseItem( val[ i ][ 0 ] )
					for ( var j = 0; j < missions.length; j++ ) { // This is probably wrong and will be wrong when the same item is two times in 1 drop table
						var misVal = missions[ j ];
						drops += "<div class='item'>" + CreateSearchLink( misVal[ 0 ] ) + ", " + CreateSearchLink( misVal[ 1 ] ) + " - " + Faction( misVal[ 3 ] ) + " " + 
						MissionType( misVal[ 2 ] ) + " " + NodeType( misVal[ 4 ] ) + ( ( item.Count > 1 ) ? ( " | " + item.Count + "x" ) : "" ) + 
						" | " + val[ i ][ 1 ] + " | " + val[ i ][ 2 ] + " | Rotation " + val[ i ][ 3 ] + 
						"</div>";
					}
				}
				
				// The drop tables for this item are not from any nodes!
				if ( drops == "" ) {
					for ( var i = 0; i < val.length; i++ ) {
						drops += "<div class='item'>" + CreateSearchLink( val[ i ][ 4 ] ) + ( ( item.Count > 1 ) ? ( " | " + item.Count + "x" ) : "" ) + 
						" | " + val[ i ][ 1 ] + " | " + val[ i ][ 2 ] + " | Rotation " + val[ i ][ 3 ] + 
						"</div>";
					}
				}
			}

			res += CreateCard( { header: "Item", body: "<div class='item' onclick='return ExpandItem( \"" + key + "\" )'>" + CreateSearchLink( key ) + "<br/><br/>Drops On:" + drops + "</div>" } );
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

			if ( val.Drops.length < 1 ) {
				drops = "<div class='item'>Unknown?</div>";
			} else {
				var dropsTable = [];
		
				// Should do proper table formatting and rotation grouping!
				for ( var i = 0; i < val.Drops.length; i++ ) {
					var missions = DataSets[ val.Drops[ i ][ 4 ] ].Missions;
					
					var item = ParseItem( val.Drops[ i ][ 0 ] )
					for ( var j = 0; j < missions.length; j++ ) {
						var misVal = missions[ j ];

						dropsTable.push( {
							Planet: misVal[ 0 ],
							Node: misVal[ 1 ],
							Faction: misVal[ 3 ],
							MissionType: misVal[ 2 ],
							NodeType: misVal[ 4 ],
							Count: item.Count,
							Rarity: val.Drops[ i ][ 1 ],
							Chance: parseFloat( val.Drops[ i ][ 2 ] ),
							Rotation: val.Drops[ i ][ 3 ],
						} )
					}
				}
	
				dropsTable.sort( function( a, b ) { return b.Chance - a.Chance } );
				for ( var i = 0; i < dropsTable.length; i++ ) {
					var drop = dropsTable[ i ];
					drops += "<div class='item'>" + CreateSearchLink( drop.Planet ) + ", " + CreateSearchLink( drop.Node ) + " - " + Faction( drop.Faction ) + " " + 
						MissionType( drop.MissionType ) + " " + NodeType( drop.NodeType ) + ( ( drop.Count > 1 ) ? ( " | " + drop.Count + "x" ) : "" ) + 
						" | " + drop.Rarity + " | " + drop.Chance + "% | Rotation " + drop.Rotation + 
						"</div>";
				}
			}
			
			if ( val.Contents.length < 1 ) {
				contents = "<div class='item'>Unknown?</div>";
			} else {
				var dropsTable = [];
				var sortTable = {};
				sortTable[ "COMMON" ] = 0;
				sortTable[ "UNCOMMON" ] = 1;
				sortTable[ "RARE" ] = 2;
				val.Contents.sort( function( a, b ) { return sortTable[ a[ 1 ] ] - sortTable[ b[ 1 ] ] } )

				// Should do proper table formatting and rotation grouping!
				for ( var i = 0; i < val.Contents.length; i++ ) {
					var drop = val.Contents[ i ];
					
					var item = ParseItem( drop[ 0 ] );
					contents += "<div class='item'>" + CreateSearchLink( Item( item.Item, item.Count ) ) + " | " + drop[ 1 ] + " | " + drop[ 2 ] + " | " + drop[ 3 ] + " | " + drop[ 4 ] + " | " + drop[ 5 ] + " | " + drop[ 6 ] + "</div>";
				}
			}

			res += CreateCard( { header: "Relic", body: "<div class='item' onclick='return ExpandRelic( \"" + key + "\" )'>" + CreateSearchLink( key ) + "<br/><br/>Contents:" + contents + "<br/>Drops On:" + drops + "</div>" } );
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
					drops += "<div class='item'>" + CreateSearchLink( dropPlace.Relic ) + 
					" | " + dropPlace.Rarity + " | (Intact) " + dropPlace.Intact + "% - " + dropPlace.Excellect + "% - " + dropPlace.Flawless + "% - " + dropPlace.Radiant + "% (Radiant) | " + dropPlace.Ducats + " Ducats" + 
					"</div>";
				}
			}

			res += CreateCard( { header: "Item", body: "<div class='item' onclick='return ExpandItem( \"" + key + "\" )'>" + CreateSearchLink( key ) + "<br/><br/>Drops On:" + drops + "</div>" } );
			continue;//break;
		}

		if ( key.toLowerCase().indexOf( txt ) < 0 ) continue;
		items.push( "<div class='item'>" + CreateSearchLink( key ) + "</div>" );
	}
	if ( items.length > 0 ) res += CreateCard( { header: "Prime Items Matches", body: items.join( "" ) } );

	if ( res.trim() == "" ) {
		res = '<div class="res"><div class="header">Failed</div><div class="container"><div class="item">Nothing Found!</div></div></div>'
	}

	document.getElementById( "results" ).innerHTML = res;
}

window.onpopstate = function(e){
	LoadGetValues( true );
};