
class Utils {
	static fireEvent(name, data) {
		document.dispatchEvent( new CustomEvent( name, { detail: data}) );
	}
	static randomID() {
		return Math.random().toString(36).slice(18);
	}
	static sumarHoras(time1, time2) {
		var date = new Date();
		date.setHours( time1.slice(0,2) );
		date.setMinutes( time1.slice(-2) );
		if (time2) {
			var addHoras = date.getHours() + parseInt(time2.slice(0,2));
			var addMinutes = date.getMinutes() + parseInt(time2.slice(-2));

			date.setHours( addHoras );
			date.setMinutes( addMinutes );
		}
		return date.toString().slice(16,21);
	}	
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
	static horario_a_min ( horario ) {
		if (horario && horario.length == 5)
		{
			var hrs = parseInt(horario.substr(0,2)),
			min = parseInt(horario.substr(-2));
			return (hrs * 60) + min;
		}
		else
		{
			return horario;
		}
	}
	static getDate() {
		var fecha = new Date().toISOString().slice(0,10);
		return fecha;
	}
	static parseDate( fecha ) {
		var d = new Date();
		var mes = parseInt(fecha.slice(5,7)) - 1; 
		return new Date(d.getFullYear(), mes, fecha.slice(8,10));
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