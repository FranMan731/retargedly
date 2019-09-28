const Data = require('../models/Data');
const { errorServidor } = require('../utils/errors');

const csv = require('fast-csv');
const fs = require('fs');
const es = require('event-stream');
const { promisify } = require('util');

const path = require('path');
const formidable = require('formidable');

const moment = require('moment');
const filesize = require('filesize');
const _ = require('lodash');

const directoryPath = path.join(__dirname, '../files');

module.exports = {
	//Llamada para crear una nueva entrada en Data a través de un archivo CSV
	createDate: async (req, res) => {
		const form = new formidable.IncomingForm();

		form.parse(req, async (err, fields, files) => {
			fs.createReadStream(files.upload.path).pipe(csv.parse()).on('data', async (row) => {
				const item = new Data({
					name: row[0],
					segment1: row[1],
					segment2: row[2],
					segment3: row[3],
					segment4: row[4],
					platformId: row[5],
					clientId: row[6]
				});

				item.save((err) => {
					if (err) throw err;
				});
			});

			return res.status(200).send({
				message: 'Archivo cargado'
			});
		});
	},

	//Llamada para obtener y/o filtrar los datos
	getData: (req, res) => {
		let { sort, sortField, fields, limit } = req.body;
		const campos = [ 'name', 'segment1', 'segment2', 'segment3', 'segment4', 'platformId', 'clientId' ];

		//Verifico el valor de sort
		sort = sort === 'asc' || sort === 'desc' ? sort : '';

		//Verifico que el valor de sortField esté en el array de campos
		sortField = _.find(campos, (o) => o === sortField);

		//Verifico que si field es un campo perteneciente al array
		fields = _.intersection(campos, fields);

		//Verifico que si el limit es un número
		limit = _.isNumber(limit) ? limit : 10;

		Data.find().select(fields).select('-__v -_id').limit(limit).sort({ [sortField]: sort }).exec((err, datos) => {
			if (err) return res.status(500).send({ message: errorServidor() });

			return res.status(200).send({
				response: datos
			});
		});
	},

	//Llamada para obtener una lista de files con sus sizes.
	getFilesList: (req, res) => {
		const { humanreadable } = req.body;
		const response = [];
		getFiles(directoryPath).then((resp) => {
			if (humanreadable) {
				resp.map((r) => {
					const formatSize = filesize(r.size, { round: 1 });

					response.push({
						name: r.name,
						size: formatSize
					});
				});
			} else {
				response.push(resp);
			}

			return res.status(200).send({
				response
			});
		});
	},

	//Llamada para obtener métricas de ciertos files.
	getMetrics: (req, res) => {
		const { filename } = req.body;
		//Guardo ext del archivo
		let ext = filename.split('.');
		ext = ext[1];
		//Variable de respuestas
    let response = {};

		//Verifico que el archivo sea tsv
		if (ext === 'tsv') {
			//Guardo el directorio del archivo
			const file = `${directoryPath}/${filename}`;
			//Guardo nombre del archivo
			const fileMetrics = `${file}-metrics.json`;

			//Si existe el archivo a buscar
			if (fs.existsSync(file)) {
				//Si existe ya un archivo con sus metricas
				if (fs.existsSync(fileMetrics)) {
					//Leo el archivo con las metricas y la guardo en la variable response
					response = JSON.parse(fs.readFileSync(fileMetrics));

					//Devuelvo la respuesta
					return res.status(200).send({
						response
					});
				} else {
					//Si no existe el archivo de metricas, guardo en response el estado de started
					response = {
						status: 'started',
						started: moment().format('YYYY-MM-DDTHH:mm:ss')
					};

					//Creo un nuevo archivo y donde le inserto el contenido de response
					fs.writeFileSync(fileMetrics, JSON.stringify(response), (err) => {

						//si hay un error, devuelvo response.
						if (err) {
							response = {
								status: 'failed',
								message: 'Fallo al crear archivo de métricas'
							};

							return res.status(500).send({
								response
							});
						}
					});

					//Llama a la función que se encarga de obtener las métricas
					startGetMetrics(file);

					return res.status(200).send({
						response
					});
				}
			} else {
				//Si no existe el archivo, guardo el estado
				response = {
					status: 'failed',
					message: 'Missing file'
				};

				return res.status(200).send({
					response
				});
			}
    } else {
			//Si el formato del archivo a buscar no es TSV, response con estado 'failed'
			response = {
					status: 'failed',
					message: 'Invalid format'
			};

			return res.status(200).send({
				response
			});
		}
    
	}
};

//Funcion que se encarga de obtener el archivo
async function getFiles(dir) {
	const readDir = promisify(fs.readdir);
	const getStat = promisify(fs.stat);

	const files = await readDir(dir);

	return Promise.all(
		files.map(async (file) => {
			const stats = await getStat(dir + `/${file}`);

			return {
				name: file,
				size: stats.size
			};
		})
	);
}

//Función que se encarga de obtener las métricas del archivo a leer
function startGetMetrics(file) {
	//Creo variable para guardar metricas
	let metrics = [];

	//Dirección del archivo
	const fl = `${file}-metrics.json`;
	//Actualizo el estado del archivo de 'started' a 'processing'
	updateStatus(fl, 'processing');

	//Comienzo la lectura del archivo
	fs.createReadStream(file).pipe(es.split()).pipe(
		es
			.mapSync((line) => {
				//Guardo en arr las líneas del archivo que están tabuladas
				const arr = line.split('\t');
				//Guardo en segments los segmentos separados por coma
				const segments = arr[1].split(',');
				//Guardo el country
				const country = arr[2];

				//Reccoro todos los segmentos
				_.forEach(segments, (value, key) => {
					//De cada segmento, le inserto un nuevo elemento con el segmento, y el país.
					metrics.push({
						segment: value,
						country
					});
				});
			})
			.on('error', (err) => {
				//Si llega haber algún error en el procesamiento, cambio el estado del archivo a failed
				updateStatus(fl, 'failed', 'Fallo el procesamiento');
			})
			.on('end', () => {
				//r: creo un array de objetos compuesto poniendo como key a segment
				let r = _.groupBy(metrics, (m) => m.segment);
				//Creo variable response
				let result = [];

				//Recorro r
				_.forEach(r, (value, key) => {
					//t: creo un array de objetos compuesto poniendo como key a country
					let arrCountry = _.groupBy(value, (v) => v.country);
					//Guardo el objeto que resulta del recorrido de arrCountry
					let arrCountryAndCount = _.map(arrCountry, (v, key) => ({ country: key, count: v.length }));

					//Pusheo en result el objeto
					result.push({ segmentId: key, Uniques: arrCountryAndCount });
				});

				updateStatus(fl, 'ready', result);
			})
	);
}

//Función que se encarga de actualizar el estado
function updateStatus(fl, tipo, resp) {
	fs.readFile(fl, (err, data) => {
		data = JSON.parse(data);

		switch (tipo) {
			case 'failed':
				data = {
					status: tipo,
					resp
				};
				break;
			case 'processing':
				data.status = tipo;
				break;
			case 'ready':
				data.status = tipo;
				data.finished = moment().format('YYYY-MM-DDTHH:mm:ss');
				data.metrics = resp;
				break;
		}

		fs.writeFile(fl, JSON.stringify(data), function(err) {
			if (err) throw err;
		});
	});
}
