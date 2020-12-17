/**
 *  Every product in your marketplace is shaped in this way:
 *    {
 *       "_id": "5d318e1a8541744830bef139", //SERVER GENERATED
 *       "name": "app test 1",  //REQUIRED
 *       "description": "somthing longer", //REQUIRED
 *       "brand": "nokia", //REQUIRED
 *       "imageUrl": "https://drop.ndtv.com/TECH/product_database/images/2152017124957PM_635_nokia_3310.jpeg?downsize=*:420&output-quality=80",
 *       "price": 100, //REQUIRED
 *       "category": "smartphones"
 *       "createdAt": "2019-07-19T09:32:10.535Z", //SERVER GENERATED
 *       "updatedAt": "2019-07-19T09:32:10.535Z", //SERVER GENERATED
 *   }
 *
 *  CRUD for Products ( /products GET, POST, DELETE, PUT)
 */

/**
 * basic imports
 */
const { response } = require("express")
const express = require("express")
const {
	openTable,
	insert,
	checkId,
	selectByField,
	toArray,
	del,
	linkFile,
} = require("../dbms")
const { join } = require("path")
const fs = require("fs-extra") //friendship ended with fs, fs extra is my new best friend
const multer = require("multer")
const { writeFile } = require("fs-extra")
const { check, validationResult } = require("express-validator")
//initialization
const router = express.Router()
const upload = multer({})
const valid = [
	check("name")
		.isLength({ min: 3 })
		.withMessage("minimum lenght is 3 characters")
		.exists()
		.withMessage("name must exist"),
	check("description")
		.isLength({ min: 5 })
		.withMessage("description too short")
		.exists()
		.withMessage("description must be provided"),
	check("brand")
		.isLength({ min: 3 })
		.withMessage("minimum lenght is 3 characters")
		.exists()
		.withMessage("brand must exist"),
	check("price")
		.isNumeric()
		.withMessage("price is usually a numeber")
		.exists()
		.withMessage("price must exist"),
]
//routes
router.get("/", async (req, res, next) => {
	let body = null

	try {
		body = await openTable("products.json")
	} catch (error) {
		console.error(error)
		error.httpStatusCode = 500
		next(error)
	}
	body = toArray(body, "_id")
	console.log(body)
	if (req.query.hasOwnProperty("category")) {
		body = body.filter((product) => product.category === req.query.category) //selectByField("products.json", "category", req.query.category, 1)
	}

	res.send(body)
})

router.post("/", valid, async (req, res, next) => {
	const errors = validationResult(req)
	if (!errors.isEmpty()) {
		const err = {}
		err.message = errors
		console.log(err.message)
		err.httpStatusCode = 400
		next(err)
		return
	}
	//console.log("non dovrei esistere")
	try {
		let body = { ...req.body }
		body.createdAt = new Date()

		const id = await insert("products.json", body, null)
		res.send(id)
	} catch (error) {
		console.error(error)
		error.httpStatusCode = 500
		next(error)
	}
})

router.delete("/:id", async (req, res, next) => {
	try {
		del("products.json", req.params.id)
		res.send("deleted")
	} catch (error) {
		console.error(error)
		error.httpStatusCode = 500
		next(error)
	}
})

router.put("/:id", valid, async (req, res, next) => {
	const errors = validationResult(req)
	if (!errors.isEmpty()) {
		const err = {}
		err.message = errors
		console.log(err.message)
		err.httpStatusCode = 400
		next(err)
		return
	}
	try {
		let body = { ...req.body }
		body.updatedAt = new Date()
		insert("products.json", body, req.params.id)
		res.send("ok")
	} catch (error) {
		console.error(error)
		error.httpStatusCode = 500
		next(error)
	}
})

router.post("/:id/image", upload.single("picture"), async (req, res, next) => {
	try {
		const dest = join(
			__dirname,
			"../../../public/img/products",
			req.file.originalname
		)

		console.log("save image in ", dest)
		console.log("buffer mime", req.file.mimetype)
		console.log(req.file.buffer)
		await writeFile(dest, req.file.buffer)
		linkFile(
			"products.json",
			req.params.id,
			"image",
			`http://localhost:${process.env.PORT || 2001}/img/products/${
				req.file.originalname
			}`
		)
		res.send("ok")
	} catch (error) {
		console.error(error)
		error.httpStatusCode = 500
		next(error)
	}
})

module.exports = router
