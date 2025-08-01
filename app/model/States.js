define(["dojo/_base/declare",
	"dojo/store/Memory",
	"dojo/_base/array"
], function (declare, Memory, arrayUtil) {
	return declare(null, {

		data: {
			states: [
				{ name: "----------STATE (US)----------", id: " ", selected: true },
				{ name: "Alabama", id: "AL" },
				{ name: "Alaska", id: "AK" },
				{ name: "Arizona", id: "AZ" },
				{ name: "Arkansas", id: "AR" },
				{ name: "California", id: "CA" },
				{ name: "Colorado", id: "CO" },
				{ name: "Connecticut", id: "CT" },
				{ name: "Delaware", id: "DE" },
				{ name: "District of Columbia", id: "DC" },
				{ name: "Florida", id: "FL" },
				{ name: "Georgia", id: "GA" },
				{ name: "Hawaii", id: "HI" },
				{ name: "Idaho", id: "ID" },
				{ name: "Illinois", id: "IL" },
				{ name: "Indiana", id: "IN" },
				{ name: "Iowa", id: "IA" },
				{ name: "Kansas", id: "KS" },
				{ name: "Kentucky", id: "KY" },
				{ name: "Louisiana", id: "LA" },
				{ name: "Maine", id: "ME" },
				{ name: "Maryland", id: "MD" },
				{ name: "Massachusetts", id: "MA" },
				{ name: "Michigan", id: "MI" },
				{ name: "Minnesota", id: "MN" },
				{ name: "Mississippi", id: "MS" },
				{ name: "Missouri", id: "MO" },
				{ name: "Montana", id: "MT" },
				{ name: "Nebraska", id: "NE" },
				{ name: "Nevada", id: "NV" },
				{ name: "New Hampshire", id: "NH" },
				{ name: "New Jersey", id: "NJ" },
				{ name: "New Mexico", id: "NM" },
				{ name: "New York", id: "NY" },
				{ name: "North Carolina", id: "NC" },
				{ name: "North Dakota", id: "ND" },
				{ name: "Ohio", id: "OH" },
				{ name: "Oklahoma", id: "OK" },
				{ name: "Oregon", id: "OR" },
				{ name: "Pennsylvania", id: "PA" },
				{ name: "Rhode Island", id: "RI" },
				{ name: "South Carolina", id: "SC" },
				{ name: "South Dakota", id: "SD" },
				{ name: "Tennessee", id: "TN" },
				{ name: "Texas", id: "TX" },
				{ name: "Utah", id: "UT" },
				{ name: "Vermont", id: "VT" },
				{ name: "Virginia", id: "VA" },
				{ name: "Washington", id: "WA" },
				{ name: "West Virginia", id: "WV" },
				{ name: "Wisconsin", id: "WI" },
				{ name: "Wyoming", id: "WY" }
			],
			province: [
				{ name: "----------PROVINCE (CA)----------", id: " " },
				{ name: "Alberta", id: "AB" },
				{ name: "British Columbia", id: "BC" },
				{ name: "Manitoba", id: "MB" },
				{ name: "New Brunswick", id: "NB" },
				{ name: "Newfoundland", id: "NF" },
				{ name: "Northwest Territories", id: "NT" },
				{ name: "Nova Scotia", id: "NS" },
				{ name: "Nunavut", id: "NU" },
				{ name: "Ontario", id: "ON" },
				{ name: "Prince Edward Island", id: "PE" },
				{ name: "Quebec", id: "QC" },
				{ name: "Saskatchewan", id: "SK" },
				{ name: "Yukon", id: "YT" }
			],
			mxStates: [
				{ name: "----------STATE (MX)----------", id: " " },
				{ name: "Aguascalientes", id: "AG" },
				{ name: "Baja California", id: "BN" },
				{ name: "Baja California Sur", id: "BS" },
				{ name: "Campeche", id: "CM" },
				{ name: "Chiapas", id: "CP" },
				{ name: "Chihuahua", id: "CH" },
				{ name: "Coahuila", id: "CA" },
				{ name: "Colima", id: "CL" },
				{ name: "Distrito Federal", id: "DF" },
				{ name: "Durango", id: "DU" },
				{ name: "Guanajuato", id: "GT" },
				{ name: "Guerrero", id: "GR" },
				{ name: "Hidalgo", id: "HI" },
				{ name: "Jalisco", id: "JA" },
				{ name: "Michoacán", id: "MC" },
				{ name: "Morelos", id: "MR" },
				{ name: "México", id: "MX" },
				{ name: "Nayarit", id: "NA" },
				{ name: "Nuevo León", id: "NL" },
				{ name: "Oaxaca", id: "OA" },
				{ name: "Puebla", id: "PU" },
				{ name: "Querétaro", id: "QE" },
				{ name: "Quintana Roo", id: "QR" },
				{ name: "San Luis Potosí", id: "SL" },
				{ name: "Sinaloa", id: "SI" },
				{ name: "Sonora", id: "SO" },
				{ name: "Tabasco", id: "TB" },
				{ name: "Tamaulipas", id: "TM" },
				{ name: "Tlaxcala", id: "TL" },
				{ name: "Veracruz", id: "VE" },
				{ name: "Yucatán", id: "YU" },
				{ name: "Zacatecas", id: "ZA" }

			],
			militaryStates: [
				{ name: "----------MILITARY STATES----------", id: "-1" },
				{ name: "AA - Armed Forces Americas", id: "AA" },
				{ name: "AE - Armed Forces Europe", id: "AE" },
				{ name: "AP - Armed Forces Pacific", id: "AP" }
			]
		},

		store: null,
		getStates: function () {
			return this.getDataStore("US");

		},
		getProvince: function () {
			return this.getDataStore("CA");
		},
		getMxStates: function () {
			return this.getDataStore("MX");
		},
		getDataStore: function (country) {
			var data;
			if (country == "US") {
				data = this.data.states;
				//data = data.concat(this.data.militaryStates);
			} else if (country == "CA") {
				data = this.data.province;
			} else if (country == "MX") {
				data = this.data.mxStates;
			} else if (country == undefined || country == " ") {
				data = this.data.states;
				data = data.concat(this.data.militaryStates);
				data = data.concat(this.data.province);
				data = data.concat(this.data.mxStates);
			} else {
				data = [{ name: "----------------------------------", id: " " }];
			}

			this.store = new Memory({
				idProperty: "id",
				data: data
			});
			return this.store;
		},

		checkValidState: function (state) {
			var data1 = arrayUtil.map(this.data.states, function (item) {
				return item.id;  // Extract and return the 'id' from each object
			});
			var data2 = arrayUtil.map(this.data.province, function (item) {
				return item.id;  // Extract and return the 'id' from each object
			});
			var ind1 = arrayUtil.indexOf(data1, state);
			var ind2 = arrayUtil.indexOf(data2, state);
			if (ind1 != -1) {
				return "US";
			}
			if (ind2 != -1) {
				return "CA";
			}

			return null;

		}

	});
});
