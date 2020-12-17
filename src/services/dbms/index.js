/**
 * all the disk I/O should be defined in this module
 *
 * we are working under the assumption that data is stored in objects named after their id's
 * so as an example this is wrong
 * [{id:0001,name:"ugo",surname:"fantozzi"},{id:0002,name:ugo,surname:"fantozzi"}]
 * but this is ok
 * {0001:{name:"ugo",surname:"fantozzi"},0002:{name:"ugo",surname:"fantozzi"}}
 *
 * writing id checking and selection by field all work under this assumption and will break if tried on an array
 *
 * I may want to add a createTable utility but it may be utterly useless since we should approach real databases soon
 *
 */

const fs = require("fs-extra")
const { join } = require("path")
const uniqid = require("uniqid")
const dbPath = join(__dirname, "../../../db")
const tables = ["products.json", "reviews.json"]

/**
 * this ensures the existance of the database and it's tables/files
 */
const initialize = async () => {
	//does dbPath exists? otherwise create it this is not really needed since ensureFile creates the whole folder structure if needed
	try {
		await fs.ensureDir(dbPath)
		console.log("database exists") //buuuuut
	} catch (err) {
		console.error("could not find nor create the database") //I kind of like the granularity of the I/O made in this way
		console.error(err)
	}
	//ensure existance of the tables
	tables.map(async (table) => {
		try {
			await fs.ensureFile(join(dbPath, table))
			console.log("table ", table, " exists")
		} catch (err) {
			console.error("could not find nor create table ", table)
		}
	})
}

/**
 * opens a json file
 * @param {*} Table the file to open
 */
const openTable = async (Table) => {
	console.log("opening file")
	Table = join(dbPath, Table)
	try {
		const table = await fs.readJSON(Table)
		return table
	} catch (error) {
		console.error("could not read", Table)
		console.error(error)
		return new Error("missing or invalid file")
	}
}

/**
 * returns true if object ID can be found in Table
 * @param {*} Table
 * @param {*} ID
 */
const checkId = async (Table, ID) => {
	let table = {}
	try {
		table = openTable(Table)
		return table.hasOwnProperty(ID)
	} catch (error) {
		console.log("could not even open the table")
	}
}

/**
 * returns an array of the objects of Table whith field equal to value
 * @param {*} Table the target of the search
 * @param {*} field the field by witch we are searcing
 * @param {*} value the value we are searching
 * @param {*} mode if 0 we return an array of ID'S, if 1 we return a list of objects
 */

const selectByField = async (Table, field, value, mode) => {
	let table = {}
	let result = []
	try {
		table = await openTable(Table)
	} catch (error) {
		console.log("could not even open the table")
	}
	console.log("field ", field, " value ", value)

	for (tuple of Object.entries(table)) {
		console.log(tuple[1][field])
		if (tuple[1][field] === value) {
			result.push(tuple[mode])
		}
	}

	console.log("result", result)
	return result
}

/**
 * saves an object into a json file
 * @param {*} Table
 */
const insert = async (Table, obj, id) => {
	let table = {}
	try {
		table = await openTable(Table)
		console.log("valid file to write on")
	} catch (error) {
		console.log("the table was empty")
		console.log(error)
		//table = {}
	}
	if (id !== null) {
		try {
			if (checkId(Table, id)) {
				err = new Error("cannot edit data that does not exist")
				throw err
			}
		} catch (error) {
			error.httpstatuscode = 400
			return error
		}
	}

	id = id ? id : uniqid()
	console.log("id dati da inserire ", id)
	table[id] = obj
	Table = join(dbPath, Table)
	fs.outputJSON(Table, table)
	return id
}

const del = async (Table, id) => {
	let table = {}
	try {
		table = await openTable(Table)
		console.log("valid file to delete fron")
	} catch (error) {
		console.log("the table was empty")
		console.log(error)
		//table = {}
	}
	delete table[id]
	Table = join(dbPath, Table)
	fs.outputJSON(Table, table)
}
/**
 * links a file to a field
 * @param {*} Table
 * @param {*} id
 */
const linkFile = async (Table, id, field, url) => {
	let table = {}
	try {
		table = await openTable(Table)
		console.log("valid file to write on")
	} catch (error) {
		console.log("the table was empty")
		console.log(error)
		//table = {}
	}
	try {
		checkId(Table, id)
	} catch (error) {
		console.error(error)
		error.httpstatuscode = 404
		return error
	}
	table[id][field] = url
	Table = join(dbPath, Table)
	fs.outputJSON(Table, table)
}

/**
 * utility fuction to convert from the internar object based format do an array based format
 * @param {*} obj
 * @param {*} idname
 */

const toArray = (obj, idname) => {
	let result = []
	let table = { ...obj }
	for (tuple of Object.entries(table)) {
		tuple[1][idname] = tuple[0]
		result.push(tuple[1])
	}
	return result
}

const toObject = (vect, primaryKey) => {
	let result = {}
	vect.forEach((tuple) => {
		let id = tuple[primaryKey]
		delete tuple[primaryKey]
		result[id] = tuple
	})
}
module.exports = {
	initialize,
	openTable,
	insert,
	checkId,
	selectByField,
	del,
	linkFile,
	toArray,
}
