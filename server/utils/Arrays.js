module.exports = function()
{
	var Arrays = {
		asyncLoop: function (list, iterator, callback) {
			//keep track of the index of the next item to be processed
	     	var nextItemIndex = 0;  

		    function report() {

		        nextItemIndex++;

		        // if nextItemIndex equals the number of items in list, then we're done
		        if (nextItemIndex === list.length) {
		            callback();
		        }
		        else {
		            // otherwise, call the iterator on the next item
		            iterator(list[nextItemIndex], report);
		        }
		    }

		    // instead of starting all the iterations, we only start the 1st one
		    iterator(list[0], report);
		}
	}
	return Arrays;
}