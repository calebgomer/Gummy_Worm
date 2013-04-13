function LinkedList() {
	this._length = 0;
	this._head = null;
}

LinkedList.prototype = {

	add: function (data){

		var node = {
			data: data,
			next: null
		},
		current;

		if (this._head === null){
			this._head = node;
		} else {
			current = this._head;

			while(current.next){
				current = current.next;
			}

			current.next = node;
		}
		this._length++;

	},

	item: function(index){

        if (index > -1 && index < this._length){
            var current = this._head,
                i = 0;

            while(i++ < index){
                current = current.next;
            }

            return current.data;
        } else {
            return null;
        }
    },

    tipOfTail: function() {
    	return this.item(this._length - 1);
    },

    remove: function(index){

        if (index > -1 && index < this._length){

            var current = this._head,
                previous,
                i = 0;

            if (index === 0){
                this._head = current.next;
            } else {

                while(i++ < index){
                    previous = current;
                    current = current.next;
                }

                previous.next = current.next;
            }

            this._length--;

            return current.data;            

        } else {
            return null;
        }
    },
};