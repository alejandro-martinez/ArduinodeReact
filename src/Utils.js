
class Utils {
	static min_a_horario( min ) {
		if (min && min.length > 1) {
			return min;
		}
		else {
			if (min == 0) {
				return null;
			}
			var hrs = Math.floor(min/60);
			hrs = hrs % 60;
			if (hrs >= 24) {
				hrs = hrs - 24;
			}
			if( hrs < 10 ) {
				hrs = "0" + hrs;
			}
			min = min % 60;
			if( min < 10 ) {
				min = "0" + min;
			}

			return hrs + ":" + min;
		}
	}
	static getDate() {
		return new Date().toISOString().slice(0,10);
	}
	static parseDate( dia, mes ) {
		var d = new Date();
		return new Date(d.getFullYear(), dia, mes).toISOString().slice(0,10);
	}
	static getDiasSemana() {
		return ['Domingo','Lunes', 'Martes', 'Miercoles',
					 'Jueves','Viernes','Sabado'];		
	}
	static getMeses() {
		return ['Enero', 'Febrero', 'Marzo', 'Abril',
					'Mayo', 'Junio', 'Julio','Agosto',
					'Septiembre','Octubre', 'Noviembre', 'Diciembre'];
	}
}

export default Utils;