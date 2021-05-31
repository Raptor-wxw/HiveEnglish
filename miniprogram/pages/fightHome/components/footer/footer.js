import router from '../../../../utils/router'
import { previewAdmire } from '../../../../utils/gameutil'

Component({
  methods: {
    onZan() {
      previewAdmire()
    },
    onToRanking() {
      router.push('ranking')
    }
  }
})
